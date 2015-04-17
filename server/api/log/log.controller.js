'use strict';
var components = require('../../components');
var apiUtils = components.apiUtils;
module.exports = function(LogResource) {

	var Log = require('./log.model');


	apiUtils.addPermissionChecks(LogResource, Log);


	LogResource.after('get', function(req, res, next) {
		Log.count({}, function(err, count) {
			var data = {};
			data.data = res.locals.bundle;
			data.total = count;
			res.locals.bundle = data;
			next();
		});
	});

};
