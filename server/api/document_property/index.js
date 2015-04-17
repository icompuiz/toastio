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

var DocumentProperty = require('./document_property.model');
var DocumentPropertyController = require('./document_property.controller');

var DocumentPropertyResource = restful
                .model('DocumentProperty',DocumentProperty.schema)
                .methods(['get','put','delete','post']);         

DocumentPropertyController.attach(DocumentPropertyResource);

module.exports = {
	resource:  DocumentPropertyResource,
	controller: DocumentPropertyController,
	model: DocumentProperty
};