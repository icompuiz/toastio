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

var FilesystemDirectory = require('./filesystem.directory.model');
var FilesystemDirectoryController = require('./filesystem.directory.controller');


var FilesystemDirectoryResource = restful
                .model(FilesystemDirectory.modelName,FilesystemDirectory.schema)
                .methods(['get','put','delete','post']);         

FilesystemDirectoryController.attach(FilesystemDirectoryResource);

module.exports = {
	resource:  FilesystemDirectoryResource,
	controller: FilesystemDirectoryController,
	model: FilesystemDirectory
};