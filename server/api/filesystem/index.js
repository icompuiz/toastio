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

var FilesystemItem = require('./filesystem.item.model');
var FilesystemController = require('./filesystem.controller');

var FilesystemResource = restful
                .model(FilesystemItem.modelName,FilesystemItem.schema)
                .methods(['get','put','delete','post']);         

FilesystemController.attach(FilesystemResource);
var routes = [{
	path: '/tcms/*',
	method: 'GET',
	middleware: FilesystemController.getFileByPath
},{
	path: '/tio/*',
	method: 'GET',
	middleware: FilesystemController.getFileByPath
},{
	path: '/tmedia/*',
	method: 'GET',
	middleware: FilesystemController.getFileByPath
}];

module.exports = {
	resource:  FilesystemResource,
	controller: FilesystemController,
	model: FilesystemItem,
	routes: routes
};