'use strict';
var buildStatus = require('../seedUtils').buildStatus;

var mongoose = require('mongoose');

function removeLogs(cb) {
	var Log = mongoose.model('Log');
	Log.remove(function(err) {
		cb(err, buildStatus('Log', 'Remove', 'All', err));
	});
}

exports.remove = removeLogs;
