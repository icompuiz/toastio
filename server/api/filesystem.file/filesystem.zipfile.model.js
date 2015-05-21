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

    var tmpfilepath = path.join(os.tmpdir(), Date.now() + '_' + zipfile.name);

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



    function processextractedfiles(processextractedfilesCb, autodeps) {

        var directories = {};

        directories[destination] = {
            _id: mongoose.Types.ObjectId(),
            path: destination,
            name: destinationName,
            items: []
        };

        var files = {};

        function stat(filepath, statcb) {

            fs.stat(filepath, function(err, statResult) {

                if (err) {
                    return statcb(err);
                }

                if (statResult.isDirectory()) {

                    directories[filepath] = {
                        _id: mongoose.Types.ObjectId(),
                        path: filepath,
                        name: path.basename(filepath),
                        items: []
                    };

                } else {
                    var fileData = {
                        _id: mongoose.Types.ObjectId(),
                        path: filepath,
                        name: path.basename(filepath),
                        type: mime.lookup(filepath),
                        size: statResult.size
                    };

                    files[filepath] = fileData;
                }

                statcb(err);

            });

        }


        async.map(autodeps.extractedFiles, stat, function(err) {

            if (err) {
                return processextractedfilesCb(err);
            }

            var fileMap = _.map(_.values(files), function(fileData) {
                var parentDirectory = directories[path.dirname(fileData.path)];
                if (parentDirectory) {
                    fileData.directory = parentDirectory._id;
                    parentDirectory.items.push(fileData._id);
                } else {
                    fileData.directory = zipfile.directory;
                }
                return fileData;
            });

            var directoryMap = _.map(_.values(directories), function(directoryData) {
                var parentDirectory = directories[path.dirname(directoryData.path)];
                if (parentDirectory) {
                    directoryData.directory = parentDirectory._id;
                    parentDirectory.items.push(directoryData._id);
                } else {
                    directoryData.directory = zipfile.directory;
                }
                return directoryData;
            });

            directoryMap = _.sortBy(directoryMap, 'path');
            fileMap = _.sortBy(fileMap, 'path');

            processextractedfilesCb(null, {
                directories: directoryMap,
                files: fileMap
            });

        });

    }

    function createdirectories(createdirectoriesCb, autodeps) {
        console.log(autodeps.filedata.directories);

        var FileSystemDirectoryModel = mongoose.model('FileSystemDirectory');
        async.eachSeries(autodeps.filedata.directories, function(directoryData, createNext) {
            var directoryDoc = new FileSystemDirectoryModel(directoryData);
            directoryDoc.save(function(err) {
            	if (err) {
                console.log('Directory %s exists', directoryData.name);            		
                return createNext(err);
            	}
              console.log('Directory %s created', directoryData.name);            		
              createNext();
            });
        }, createdirectoriesCb);


    }

    function uploadfiles(uploadfilesCb, autodeps) {

        async.each(autodeps.filedata.files, function(fileData, createNext) {

            var FileModel = getFileModelForType(fileData.type);
            var fileDoc = new FileModel(fileData);

            fileDoc.tmpFile = fileData;

            function onFileCopied(err, gridStoreFile) {

                if (err) {
                    return createNext(err);
                    // return console.log('Error %s', err);
                }

                fileDoc.fileId = gridStoreFile.fileId;

                fileDoc.save(function(err) {
                    if (err) {
                        return createNext(err);
                    }
                    createNext();
                });
            }

            var copyData = {
                path: fileData.path,
                name: fileData.name,
                type: fileData.type,
                size: fileData.size
            };

            fileDoc.copyFile(copyData, onFileCopied);

        }, uploadfilesCb);

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
        'filedata': ['extractedFiles', processextractedfiles],
        'directories': ['filedata', createdirectories],
        'uploadfiles': ['directories', uploadfiles]
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
