'use strict';
var _ = require('lodash');
var mongoose = require('mongoose');
var async = require('async');
var buildStatus = require('../seedUtils').buildStatus;

function removeMisc(cb) {
	var Document = mongoose.model('Document');
	var Type = mongoose.model('Type');
	var Template = mongoose.model('Template');
	var Script = mongoose.model('Script');
	var Block = mongoose.model('Block');
	var Setting = mongoose.model('Setting');

	var models = 
	{
		Document: Document,
		Type: Type,
		Template: Template,
		Script: Script,
		Block: Block,
		Setting: Setting
	};
	var statuses = [];
	async.each(_.keys(models), function iterate(key, iterateCb) {

		var Model = models[key];

		Model.remove(function(err) {
			statuses.push(buildStatus(key, 'Remove', 'All', err));
			iterateCb(err);
		});

	}, function(err) {
		cb(err, statuses);
	});
}

exports.remove = removeMisc;