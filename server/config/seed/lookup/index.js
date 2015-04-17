'use strict';
var buildStatus = require('../seedUtils').buildStatus;

var mongoose = require('mongoose');
var seedData = require('./seedData');

function removeLookups(cb) {
	var Lookup = mongoose.model('Lookup');
	Lookup.remove(function(err) {
		cb(err, buildStatus('Lookup', 'Remove', 'All', err));
	});
}

function addLookups(cb) {
	var Lookup = mongoose.model('Lookup');
	Lookup.create(seedData, function(err) {
		cb(err, buildStatus('Lookup', 'Create', 'All', err));
	});
}

exports.remove = removeLookups;
exports.add = addLookups;