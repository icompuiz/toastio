'use strict';
var components = require('../../components');
var apiUtils = components.apiUtils;
module.exports = function(LookupResource) {
	var Lookup = require('./lookup.model');

	LookupResource.before('get', function(req, res, next) {

		if (!req.params.id) {

			if (req.query.org === 'null') {
				req.quer.where({
					org: null
				});
			}

		}

		next();

	})

	apiUtils.addPermissionChecks(LookupResource, Lookup);


};