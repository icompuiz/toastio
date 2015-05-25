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

var Log = require('./log.model');
var logController = require('./log.controller');

var LogResource = restful
                .model(Log.modelName,Log.schema)
                .methods(['get','put','delete','post']);         

logController(LogResource);

module.exports = {
	resource:  LogResource,
	controller: logController,
	model: Log
};