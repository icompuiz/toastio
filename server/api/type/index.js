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

var Type = require('./type.model');
var TypeController = require('./type.controller');

var TypeResource = restful
                .model('Type',Type.schema)
                .methods(['get','put','delete','post']);         

TypeController.attach(TypeResource);

module.exports = {
	resource:  TypeResource,
	controller: TypeController,
	model: Type
};