'use strict';
var buildStatus = require('../seedUtils').buildStatus;

var async = require('async');
var mongoose = require('mongoose');
var seedData = require('./seedData');

function removeGroups(cb) {
	var Group = mongoose.model('Group');
	Group.remove(function(err) {
		cb(err, buildStatus('Building', 'Remove', 'All', err));
	});
}

function addGroups(cb, data) {

	var Group = mongoose.model('Group');

	data = data || seedData;

	async.each(data, function(groupObj, next) {
		var group = new Group(groupObj);
		group.save(function(err) {
			if (err) {
				return next(err);
			}
			console.log(group.name, 'group added');

			next();
		});

	}, function(err) {
		if (err) {
			console.log('addGroups', err);
			return cb();
		}

		console.log('addGroups successful');
		cb(err, buildStatus('Groups', 'Add', 'All', err));
	});
}

exports.remove = removeGroups;
exports.add = addGroups;
