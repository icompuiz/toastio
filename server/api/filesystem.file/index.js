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

var FilesystemFile = require('./filesystem.file.model');
var FilesystemFileController = require('./filesystem.file.controller');

var FilesystemFileResource = restful
                .model(FilesystemFile.modelName,FilesystemFile.schema)
                .methods(['get','put','delete','post']);         

FilesystemFileController.attach(FilesystemFileResource);

module.exports = {
	resource:  FilesystemFileResource,
	controller: FilesystemFileController,
	model: FilesystemFile
};