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

var TypeProperty = require('./type_property.model');
var TypePropertyController = require('./type_property.controller');

var TypePropertyResource = restful
                .model('TypeProperty',TypeProperty.schema)
                .methods(['get','put','delete','post']);         

TypePropertyController.attach(TypePropertyResource);

module.exports = {
	resource:  TypePropertyResource,
	controller: TypePropertyController,
	model: TypeProperty
};