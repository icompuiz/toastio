'use strict';
var buildStatus = require('../seedUtils').buildStatus;

var mongoose = require('mongoose');
var async = require('async');
function removeFileSystemFiles(cb) {

	var FileSystemFile = mongoose.model('FileSystemFile');
	FileSystemFile.find({}, function(err, files) {
		if (err) {
			return cb(err);
		}
		async.each(files, function(file, next) {

			var FileModel = mongoose.model(file._class);
			var realModel = new FileModel(file.toObject());

			realModel.remove(next);
		}, function(err) {
			cb(err, buildStatus('FileSystemFile', 'Remove', 'All', err));
		});
	});
}

exports.remove = removeFileSystemFiles;