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

var Template = require('./template.model');
var TemplateController = require('./template.controller');

var TemplateResource = restful
                .model('Template',Template.schema)
                .methods(['get','put','delete','post']);         

TemplateController.attach(TemplateResource);

module.exports = {
	resource:  TemplateResource,
	controller: TemplateController,
	model: Template
};