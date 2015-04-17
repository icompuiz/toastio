/* global require: true, console: true */
'use strict';

var mongoose = require('mongoose'),
    GridStore = mongoose.mongo.GridStore,
    fs = require('fs'),
    ObjectId = mongoose.mongo.BSONPure.ObjectID,
    _ = require('lodash'),
    os = require('os'),
    async = require('async'),
    path = require('path'),
    q = require('q');

require('mongoose-schema-extend');

var FileSystemItem = require('../filesystem/filesystem.item.model');

var prefix = 'fs';


var FileSystemFileSchema = FileSystemItem.schema.extend({
    fileId: {
        type: mongoose.Schema.Types.ObjectId
    },
    downloadsRemaining: {
        default: -1,
        type: Number
    }
});

var copyFile = function(file, doneCopyingFile, removeFile) {
    console.log('REMOVE FILE', removeFile);
    function onFileExists(err, exists) {
        if (exists) {

            var options = {
                root: prefix,
                // metadata: file.metadata,
                'content_type': file.type
            };

            var gridStore = new GridStore(mongoose.connection.db, new ObjectId(), file.name, 'w', options);
            gridStore.writeFile(file.path, function(err, storedFile) {
                if (err) {
                    console.log('model::file::copyFile::gsWriteFile::error', file.name, err.message);
                    return doneCopyingFile(err);
                }

                if (removeFile) {
                    fs.unlink(file.path, function() {
                        console.log('model::file::copyFile::gsWriteFile::remove tmp file::success');
                        doneCopyingFile(null, storedFile);
                    });
                } else {
                    console.log('model::file::copyFile::gsWriteFile::success');
                    doneCopyingFile(null, storedFile);
                }
            });

        } else {



            var error = new Error('File does not exist on file system ' + file.name);
            console.log('model::file::copyFile::exists::does not exist', file.name, error.message);

            return doneCopyingFile(error);
        }
    }

    function fileExistsAsIs(fileExistsAsIsDone) {
        // var ext = path.extname(file.path).trim();
        fs.exists(file.path, function(exists) {
            fileExistsAsIsDone(null, exists);
        });
        
    } 
    
    function fileExistsUpperCase(exists, fileExistsUpperCaseDone) {

        if (exists) {
            fileExistsUpperCaseDone(null, exists);
        } else {
            var ext = path.extname(file.path).trim().toUpperCase();
            var filePath = file.path.replace(path.extname(file.path), ext);

            fs.exists(filePath, function(exists) {
                if ( exists) {
                    file.path = filePath;
                }
                fileExistsUpperCaseDone(null, exists);
            });
        }

    }  

    function fileExistsLowerCase(exists, fileExistsLowerCaseDone) {

        if (exists) {
            fileExistsLowerCaseDone(null, exists);
        } else {
            var ext = path.extname(file.path).trim().toLowerCase();
            var filePath = file.path.replace(path.extname(file.path), ext);

            fs.exists(filePath, function(exists) {
                if ( exists) {
                    file.path = filePath;
                }
                fileExistsLowerCaseDone(null, exists);
            });
        }

    }
    var tasks = [fileExistsAsIs, fileExistsUpperCase, fileExistsLowerCase];
    async.waterfall(tasks, onFileExists);

};

var fileName = function(cb) {
    require('crypto').randomBytes(48, function(ex, buf) {
        var token = buf.toString('hex');
        cb(token);
    });
};

var copyStream = function(stream, type) {
    console.log('model::file::copyStream::enter');

    var streamPromise = q.defer();

    fileName(function(token) {

            console.log('model::file::copyStream::got name', token);

        var fullname = path.join(os.tmpdir(), token);

        fullname = path.resolve(fullname);
            console.log('model::file::copyStream::fullname', fullname);
            

        var writeStream = fs.createWriteStream(fullname);

        var fileData = {
            name: token,
            path: fullname,
            type: type
        };

        stream.on('end', function() {

                    console.log('model::file::copyStream::stream.pipe::success');

            copyFile(fileData, function(err, gridStore) {
                
                fs.unlink(fullname, function() {
                                    console.log('model::file::copyStream::stream.pipe::success', 'Deleting tmp file', fullname);

                    streamPromise.resolve(gridStore);

                });

            });

        });

        stream.pipe(writeStream);


    });

    return streamPromise.promise;

};

var download = function(fileId, sendStream) {

    function onFileOpen(err, fileStream) {
        if (err) {

            console.log('model::file::download::statics::onFileOpen::err');
            return sendStream(err);
        }

        console.log('model::file::download::statics::onFileOpen::success', 'sending stream');

        return sendStream(null, fileStream);
    }

    console.log('model::file::download::statics::onFileStreamReady::enter', fileId);


    var gridStore = new GridStore(mongoose.connection.db, fileId, 'r', {
        root: prefix
    });

    gridStore.open(onFileOpen);

};

var deleteFile = function(fileId, doneDeletingFile) {

    function doDelete(fileStream) {

        if (!fileStream) {
            return doneDeletingFile();
        }

        fileStream.unlink(function(err) {
            if (err) {
                return doneDeletingFile(err);
            }

            doneDeletingFile(null, fileStream);
        });
    }

    function onFileOpen(err, fileStream) {

        if (err) {
            doneDeletingFile(err);
        }

        doDelete(fileStream);

    }

    var gridStore = new GridStore(mongoose.connection.db, fileId, 'r', {
        root: prefix
    });

    gridStore.open(onFileOpen);

};

// Copys the file into fileId
FileSystemFileSchema.statics.copyFile = copyFile;
FileSystemFileSchema.statics.fileName = fileName;

FileSystemFileSchema.statics.copyStream = copyStream;

FileSystemFileSchema.statics.download = download;

FileSystemFileSchema.statics.delete = deleteFile;

FileSystemFileSchema.methods.download = function(sendStream, fileVersion) {
    var file = this;

    fileVersion = fileVersion || 'fileId';

    function onFileStreamReady(err, fileStream) {
        if (err) {
            console.log('model::file::methods::download::onFileStreamReady::err', err);
            return sendStream(err);
        }

        console.log('model::file::methods::download::onFileStreamReady::enter', fileStream.fileId, fileStream.filename);
        sendStream(null, fileStream);
    }

    console.log('model::file::download::version', fileVersion);

    var fileId = file[fileVersion];

    if (!fileId) {
        // if (file._class) {

        // var SubClass = mongoose.model(file._class);

        if (!_.isFunction(file.handleVersionNotFound)) {
            var err = new Error('File Id for ' + fileVersion + ' is not set');
            return onFileStreamReady(err);
        }

        file.handleVersionNotFound(fileVersion, function(err, fileId) {
            console.log('model::file::handleVersionNotFound::after', fileVersion);

            if (err) {
                console.log('model::file::handleVersionNotFound::after::err', err);
                return onFileStreamReady(err);
            }
            download(fileId, onFileStreamReady);
        });

        // } else {
        //  var err = new Error('File Id for ' + fileVersion +  ' is not set');
        //  return onFileStreamReady(err);
        // }
    } else {
        console.log('model::file::downloading', fileId);

        download(fileId, onFileStreamReady);
    }


};

FileSystemFileSchema.methods.copyFile = function(tmpData, doneCopyingFile, removeFile) {

    function onFileCopied(err, storedFile) {

        if (err) {
            return doneCopyingFile(err);
        }


        doneCopyingFile(null, storedFile);
    }

    copyFile(tmpData, onFileCopied, removeFile);

};

FileSystemFileSchema.pre('remove', function(done) {

    var file = this;

    function removeGridStore(removeGridStoreDoneCB) {

        console.log('model::File::pre::remove::file::enter', file._id, file.fileId);
        return deleteFile(file.fileId, function(error) {
            // not handling error
            console.log('model::fsfile:removeGridStore::error', error);
            removeGridStoreDoneCB();
        });

    }

    if (file.fileId) {
        removeGridStore(done);
    } else {
        done();
    }

});

function getBuffer(callback, version) {

    var FileSystemFile = mongoose.model('FileSystemFile');

    /* jshint validthis: true */
    var file = this;

    // the id is an ObjectID already

    version = version || 'fileId';

    var fileId = file[version];

    if (!fileId) {
            
        if (_.isFunction(file.handleVersionNotFound)) {
            file.handleVersionNotFound(version, function() {
                FileSystemFile.findById(file._id).exec(function(err, updatedFile) {
                    if (err) {
                        callback(err);
                    } else {
                        getBuffer.call(updatedFile, callback, version);
                    }
                })
            });
        }

    } else {
        var gs = new GridStore(mongoose.connection.db, fileId, 'r', {
            root: prefix
        });

        gs.open(function(err, store) {

            store.seek(0, function() {
                store.read(function(err, buff) {
                    if (err) {
                        return callback(err);
                    }
                    callback(null, store, buff);
                });
            });
        });
    }
}

FileSystemFileSchema.methods.getBuffer = getBuffer;

FileSystemFileSchema.methods.convert = function(format, done) {
    console.log('model::FileSystemFile::convert::', 'not implemented');
    done();
};

module.exports =  mongoose.model('FileSystemFile', FileSystemFileSchema);