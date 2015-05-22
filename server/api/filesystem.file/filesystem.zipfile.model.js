'use strict';

var mongoose = require('mongoose'),
    fs = require('fs'),
    os = require('os'),
    async = require('async'),
    path = require('path'),
    mime = require('mime'),
    _ = require('lodash'),
    Zip = require('node-7z'),
    rmdir = require('rimraf');

require('mongoose-schema-extend');

var FileSystemFile = require('./filesystem.file.model');

var FileSystemZipFileSchema = FileSystemFile.schema.extend({});

// enable virtual
FileSystemZipFileSchema.set('toJSON', {
    virtuals: true
});

FileSystemZipFileSchema.set('toObject', {
    virtuals: true
});

FileSystemZipFileSchema.pre('save', function(done) {

    console.log('Uploading zip file');

    done();

});

function getFileModelForType(type) {

    var ZipFile = mongoose.model('FileSystemZipFile');
    var ImageFile = mongoose.model('FileSystemImageFile');
    var File = mongoose.model('FileSystemFile');

    var model = File;

    if (type.match(/^image/) && !type.match(/svg/)) {
        model = ImageFile;
    } else if (type.match(/zip/)) {
        model = ZipFile;
    }

    return model;
}

var extract = function(extractCb) {

    var zipfile = this;

    var tmpfilepath = path.join(os.tmpdir(),  Date.now() + '_' + zipfile.name);

    var ext = path.extname(tmpfilepath);
    var destination = tmpfilepath.replace(ext, '');

    var destinationName = zipfile.name.replace(ext, '');

    function writetodisk(writetodiskCb) {

        console.log(tmpfilepath);

        function receiveStream(err, gridFsStream) {

            if (err) {
                return extractCb(err);
            }

            var readableStream = gridFsStream.stream(true);

            var writableStream = fs.createWriteStream(tmpfilepath);


            readableStream.on('close', function() {

                console.log('zip file written to disk', tmpfilepath);

                writetodiskCb(null, tmpfilepath);


            });

            readableStream.on('error', function(err) {


                writetodiskCb(err);

            });

            readableStream.pipe(writableStream);




        }

        zipfile.download(receiveStream);

    }

    function extractfile(extractfilecb, autodeps) {

        var archive = new Zip();
        var extractedFiles = [];

        console.log('Destination::', destination);

        archive.extractFull(autodeps.tmpfilepath, destination, {
                r: true
            })
            .progress(function(files) {

                extractedFiles = _.map(files, function(file) {
                    return path.join(destination, path.normalize(file).trim());
                });

            })
            .then(function() {
                console.log('Extracting done!');
                extractfilecb(null, extractedFiles);
            })
            // On error 
            .catch(function(err) {
                console.error('Error', err);
                extractfilecb(err);
            });


    }

    function recursiveUpload(recursiveUploadCb, autodeps) {

        function uploadfile(filename, parentDirectoryDoc, stat, uploadFileCb) {

            var type = mime.lookup(filename);
            var fileData = {
                path: filename,
                name: path.basename(filename),
                type: type,
                size: stat.size,
                directory: parentDirectoryDoc._id
            };

            var FileModel = getFileModelForType(type);
            var fileDoc = new FileModel(fileData);
            fileDoc.tmpData = fileDoc;

            function onFileCopied(err, gridStoreFile) {

                if (err) {
                    return uploadFileCb(err);
                    // return console.log('Error %s', err);
                }

                fileDoc.fileId = gridStoreFile.fileId;

                fileDoc.save(function(err) {
                    if (err) {
                        return uploadFileCb(err);
                    }
                    uploadFileCb();
                });
            }

            var copyData = {
                path: fileData.path,
                name: fileData.name,
                type: fileData.type,
                size: fileData.size
            };

            fileDoc.copyFile(copyData, onFileCopied);


        }

        function uploadDirectory(directoryName, parentDirectoryDoc, uploadDirectoryCb, usename) {

            console.log('Uploading directory %s', directoryName);

            function createDirectory(createDirectoryCb) {
                var FileSystemDirectoryModel = mongoose.model('FileSystemDirectory');
                var directoryDoc = new FileSystemDirectoryModel({
                    name: usename || path.basename(directoryName),
                    directory: parentDirectoryDoc._id,
                    items: []
                });

                directoryDoc.save(function(err) {
                    createDirectoryCb(err, directoryDoc);
                });
            }

            function processFiles(directoryDoc, processFilesCb) {

                fs.readdir(directoryName, function(err, files) {

                    async.each(files, function iterator(basename, iteratorCb) {

                        var filename = path.join(directoryName, basename);

                        var stat = fs.statSync(filename);

                        if (stat.isDirectory()) {
                            uploadDirectory(filename, directoryDoc, iteratorCb);
                        } else {
                            uploadfile(filename, directoryDoc, stat, iteratorCb);
                        }

                    }, processFilesCb);

                });
            }

            var tasks = [
                createDirectory,
                processFiles
            ];

            async.waterfall(tasks, uploadDirectoryCb);
        }


        var parentDoc = {
            _id: zipfile.directory
        };

        uploadDirectory(destination, parentDoc, recursiveUploadCb, destinationName);

    }

    function deletetempfiles(deletetempfilesCb) {

        function deleteZip(deleteZipCb) {
            fs.unlink(tmpfilepath, function(err) {
                console.log('tempfiles deleted');
                deleteZipCb(err);
            });

        }

        function deleteDir(deleteDirCb) {
            rmdir(destination, function(err) {
                console.log('tmpdir deleted');
                deleteDirCb(err);
            });
        }

        async.parallel([
            deleteZip,
            deleteDir
        ], deletetempfilesCb);


    }

    var tasks = {
        'tmpfilepath': [writetodisk],
        'extractedFiles': ['tmpfilepath', extractfile],
        'recursiveUpload': ['extractedFiles', recursiveUpload],
        // 'filedata': ['extractedFiles', processextractedfiles],
        // 'directories': ['filedata', createdirectories],
        // 'uploadfiles': ['directories', uploadfiles]
    };

    async.auto(tasks, function(err) {
        deletetempfiles(function(deleteErrs) {
            if (deleteErrs) {
                return extractCb(deleteErrs);
            }

            if (err) {
                return extractCb(err);
            }


            extractCb();

        });
    });

};

FileSystemZipFileSchema.methods.extract = extract;



module.exports = mongoose.model('FileSystemZipFile', FileSystemZipFileSchema);
