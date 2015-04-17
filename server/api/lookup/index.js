'use strict';


// =========================================
// By default this pattern registers
//
// GET /resources
// GET /resources/:id
// POST /resources
// PUT /resources/:id
// DELETE /resources/:id
//
// Where /resources = the base URL that is passed by the .register() function.

var restful = require('node-restful');

var Lookup = require('./lookup.model');
var LookupController = require('./lookup.controller');

var LookupResource = restful
                .model(Lookup.modelName,Lookup.schema)
                .methods(['get','put','delete','post']);         

LookupController(LookupResource);

module.exports = {
	resource:  LookupResource,
	controller: LookupController,
	model: Lookup
};