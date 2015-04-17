'use strict';
var buildStatus = require('../seedUtils').buildStatus;


var async = require('async');
var mongoose = require('mongoose');
var seedData = require('./seedData');

function removeRoutes(doneRemovingRoutes) {
	var Route = mongoose.model('Route');
	Route.find({}, function(err, routes) {
		if (err) {
			console.log('loadData::removeRoutes::fail', err);
			return doneRemovingRoutes(err);
		}

		async.each(routes, function(route, nextRoute) {
			route.remove(nextRoute);
		}, function(err) {
			console.log('loadData::removeRoutes::success');
			doneRemovingRoutes(err, buildStatus('Routes', 'Remove', 'All', err));
		});

	});
}

function addRoutes(doneAddingRoutes, routes) {

	var Route = mongoose.model('Route');
	var AccessControlList = mongoose.model('AccessControlList');

	routes = routes || seedData;

	var paths = Object.keys(routes);

	async.each(paths, function(path, processNextPath) {

		var route = new Route({
			path: path,
			name: path
		});

		var groups = routes[path];

		function addGroups(doneAddingGroups) {
			console.log('loadData::addRoutes::each::addGroups::enter', route.acl);
			AccessControlList
				.addGroups(route.acl, groups, doneAddingGroups);
		}

		route.save(function(err) {

			// add access
			if (err) {
				return processNextPath(err);
			}


			console.log('loadData::addRoutes::saveRoute::success', path);
			console.log('loadData::addRoutes::saveRoute', 'Adding Users and Groups');
			async.series({
				groups: addGroups
			}, function(err) {
				if (err) {
					return processNextPath(err);
				}

				processNextPath();
			});


		});

	}, function(err) {
		doneAddingRoutes(err, buildStatus('Routes', 'Add', 'All', err));
	});

}

exports.add = addRoutes;
exports.remove = removeRoutes;