'use strict';
var mongoose = require('mongoose');
var argv = require('optimist').argv;
var fs = require('fs');
var async = require('async');
var statusService = require('../components/status.service');

function parse(app, parseCB) {

	var seedDb = require('./seed');

	var tasks = [];

	function setRootUser(cb) {
		mongoose.model('User').findOne({
			username: 'root'
		}, function(err, root) {

			if (err) {
				return cb(err);
			}

			if (!root) {
				console.log('system administrator account not found');
				return cb(new Error('system administrator account not found'));
			}

			statusService.session = {
				user: root
			};

			cb(null);

		});
	}

	if (argv['init:all']) {
		tasks.push(seedDb.all);
	} else {

		tasks.push(setRootUser);
		if (argv['init:routes']) {
			tasks.push(seedDb.tasks.removeRoutes);
			tasks.push(seedDb.tasks.addRoutes);
		}

	}

	async.series(tasks, function(err, results) {
		statusService.session = null;
		if (err) {
			return parseCB(err);
		}
		if (argv.stop) {
			return parseCB(null, false);
		}
		parseCB(null, true);
	});


}

module.exports = {
	parse: parse
};
