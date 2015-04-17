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

var Document = require('./document.model');
var DocumentController = require('./document.controller');

var DocumentResource = restful
                .model('Document',Document.schema)
                .methods(['get','put','delete','post']);         

DocumentController.attach(DocumentResource);

module.exports = {
	resource:  DocumentResource,
	controller: DocumentController,
	model: Document
};