'use strict';

var mongoose = require('mongoose'),
    fs = require('fs'),
    os = require('os'),
    async = require('async'),
    path = require('path'),
    mime = require('mime'),
    _ = require('lodash');

require('mongoose-schema-extend');

var FileSystemFile = require('./filesystem.file.model');

var FileSystemTextFileSchema = FileSystemFile.schema.extend({});

// enable virtual
FileSystemTextFileSchema.set('toJSON', {
    virtuals: true
});

FileSystemTextFileSchema.set('toObject', {
    virtuals: true
});

function edit(text, editCb) {
    var textfile = this;

    function writeText(writeTextCb) {


        function onWriteFile(err, fileData) {

            if (err) {
                return writeTextCb(err);
            }

            console.log('model::FileSystemTextFile::edit::writeText::success', fileData);

            writeTextCb(null, fileData);

        }

        textfile.write(text, onWriteFile);

    }

    var tasks = {
        'filedata': [writeText],
    };

    async.auto(tasks, function(err) {
        if (err) {
            return editCb(err);
        }

        editCb();
    });
}


FileSystemTextFileSchema.methods.edit = edit;



module.exports = mongoose.model('FileSystemTextFile', FileSystemTextFileSchema);
