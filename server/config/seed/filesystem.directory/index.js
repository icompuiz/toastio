'use strict';
var buildStatus = require('../seedUtils').buildStatus;

var mongoose = require('mongoose');

function removeFileSystemDirectories(cb) {
    var FileSystemDirectory = mongoose.model('FileSystemDirectory');
    FileSystemDirectory.remove(function(err) {
        cb(err, buildStatus('FileSystemDirectory', 'Remove', 'All', err));
    });
}

function addRootDirectory(addRootDirectoryCb) {
    var FileSystemDirectory = mongoose.model('FileSystemDirectory');

    var directory = {
        name: 'Site Root',
        type: 'folder'
    };

    directory = new FileSystemDirectory(directory);

    directory.save(function(err) {
        if (err) {
            console.log('loadData::addRootDirectory::error', err);
            return addRootDirectoryCb(err, 'addRootDirectory::error');

        }
        console.log('loadData::addRootDirectory::success');

        addRootDirectoryCb(err, buildStatus('FileSystemDirectory', 'addRootDirectory', 'successful', err));
    });
}

exports.remove = removeFileSystemDirectories;
exports.root = addRootDirectory;
