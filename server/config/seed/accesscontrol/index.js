'use strict';
var buildStatus = require('../seedUtils').buildStatus;


var async = require('async');
var mongoose = require('mongoose');

function removeAccessControlLists(cb) {
	var AccessControlList = mongoose.model('AccessControlList');
	AccessControlList.remove(function(err) {
		cb(err, buildStatus('AccessControlLists', 'Remove', 'All', err));
	});
}

function removeAccessControlEntries(cb) {
	var AccessControlEntry = mongoose.model('AccessControlEntryBase');
	AccessControlEntry.remove(function(err) {
		cb(err, buildStatus('AccessControlEntries', 'Remove', 'All', err));
	});
}

module.exports = {
	removeAccessControlEntries: removeAccessControlEntries,
	removeAccessControlLists: removeAccessControlLists
};