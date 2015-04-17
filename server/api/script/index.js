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

var Script = require('./script.model');
var ScriptController = require('./script.controller');

var ScriptResource = restful
                .model('Script',Script.schema)
                .methods(['get','put','delete','post']);         

ScriptController.attach(ScriptResource);

module.exports = {
	resource:  ScriptResource,
	controller: ScriptController,
	model: Script
};