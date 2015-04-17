var mongoose = require('mongoose'),
	Route = require('./api/route.model'),
	_ = require('lodash');

function toACLDefinition(subject) {
	var urlParts = subject.split('/');

	var index = 1;
	var corrected = _.map(urlParts, function(part) {


		if (part.match(/[0-9a-fA-F]{24}/)) { // if there is an unexpected parameterized route, create a default parameter to check
			var param = ':param' + index;
			index++;
			return param;
		} else if (part === ':id([0-9a-fA-F]{24}$)?') { // special case for node-restful routes - node resful routes must be defined as /api/model/:id
			return ':id';
		} else if (part.trim() === '') {} else {
			return part;
		}

	});

	return corrected.join('/');
}	

module.exports.checkRoute = function(req, res, next) {
	console.log('controller::route::checkRoute::enter');

	if (req.params.id) {

		console.log('controller::route::checkRoute', 'forwarding to object permission checks');

		return next();
	}


	var right;
	if ('get' === req.method.toLowerCase()) {
		right = 'read';
	} else if ('post' === req.method.toLowerCase()) {
		right = 'create';
	}

	if (!right) {
		return next();
	}
	var chkPath = toACLDefinition(req.path);

	console.log('controller::route::checkRoute::user', req.user.username, req.user._id);
	console.log('controller::route::checkRoute::right', right, 'on', req.path);
	console.log('controller::route::checkRoute::corrected path', chkPath);
	Route.findOne({
		path: chkPath
	}).exec(function(err, routeData) {

		if (err || !routeData) {

			if (!routeData) {
				err = 'Permissions for route not defined';
			}

			return res.json(500, err);
		}

		// var route = new Route(routeData);
		routeData.isAllowed(right, function(err, isAllowed) {
			if (err) {
				return res.json(500, err);
			}

			if (isAllowed) {
				return next();
			}

			res.send(401, 'Forbidden');


		});
	});

};