'use strict';
var buildStatus = require('../seedUtils').buildStatus;

var mongoose = require('mongoose');

function removeFileSystemDirectories(cb) {
	var FileSystemDirectory = mongoose.model('FileSystemDirectory');
	FileSystemDirectory.remove(function(err) {
		cb(err, buildStatus('FileSystemDirectory', 'Remove', 'All', err));
	});
}
exports.remove = removeFileSystemDirectories;
