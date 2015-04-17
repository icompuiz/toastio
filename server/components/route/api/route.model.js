'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	async = require('async');

var path = require('path');

var accessControl = require('../../accessControl');

var routeSchema = new Schema({
	path: {
		type: String,
		required: true
	},
	name: String
});

routeSchema.plugin(accessControl, {
	administrators: false
});

routeSchema.statics.whatResources = function(userId, callback) {
	var User = mongoose.model('User');

	var RouteModel = this;


	function findUser(findUserTaskDone) {
		User.findById(userId).exec(findUserTaskDone);
	}

	function getRoutes(user, getRoutesTaskDone) {
		RouteModel.find({}).exec(function(err, routes) {
			getRoutesTaskDone(err, routes, user);
		});
	}


	function checkRoutes(routes, user, checkRoutesTaskDone) {
		var routeMap = {};

		function doCheck(route, doCheckNext) {

			route.isAllowed('read', function(err, isAllowed) {

				routeMap[route.path] = isAllowed;
				doCheckNext();

			}, user);
		}

		async.each(routes, doCheck, function afterChecked(err) {
			checkRoutesTaskDone(err, routeMap);
		});
	}

	var tasks = [findUser, getRoutes, checkRoutes];

	async.waterfall(tasks, function(err, routeMap) {
		if (err) {
			return callback(err);
		}
		// routeMap = Object.keys(routeMap);
		callback(null, routeMap);
	});


};

module.exports = mongoose.model('Route', routeSchema);