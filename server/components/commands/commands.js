'use strict';
var mongoose = require('mongoose');
var Route = mongoose.model('Route');
var SVN = require('svn-spawn');
var statusService = require('../status.service');


function setGlobalUser(req, res, next) {

	function setUser() {
		statusService.session = req;
	}

	var User = mongoose.model('User');

	if (!req.user) {

		console.log('ensureAuthorized: req.user is null, forcing user to public');
		User.findOne({
			username: 'public'
		}, function(err, user) {

			if (err) {
				console.log('setGlobalUser: Unexpected Error:', err);
				return res.send(500, 'Unexpected authorization error');
			}

			if (!user) {
				console.log('setGlobalUser: Public user not found:', err);
				return res.send(500, 'Unexpected authorization error');
			}
			req.user = user;

			setUser();
			return next();
		});

	} else {
		setUser();
		return next();

	}


}


function commandWhoami(req, res) {

	var id = req.user._id.toString();
	var username = req.user.username;

	if (req.query.noresources) {

		var user = {
			_id: id,
			username: username,
		};

		res.jsonp(200, user);

	} else {
		Route.whatResources(id, function(err, resources) {
			if (err) {
				console.log('Unexpected error setting user cookie', err);

				return res.send(500);

			}
			console.log('expressRoutes::who::After finding user resources');

			req.user.populate('mruOrgs', function(err, user) {
				console.log('expressRoutes::who::After populating mruOrgs');

				user = {
					_id: user._id,
					username: user.username,
					resources: resources,
					mruOrgs: user.mruOrgs || []
				};

				res.json(200, user);
			});

		});

	}




}


function addCookies(req, res, next) {
	var svnClient = new SVN({
		cwd: __dirname
	});

	svnClient.getInfo(function(err, data) {
		if (data) {
			res.cookie('revision', data.$.revision);
		}

		next();
	});
}

module.exports = {
	whoami: commandWhoami,
	setGlobalUser: setGlobalUser,
	addCookies: addCookies
};
