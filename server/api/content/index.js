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

var ContentController = require('./content.controller');

var routes = [{
    path: '/:documentId([0-9a-fA-F]{24})',
    method: 'GET',
    middleware: [ContentController.viewById]
},{
    path: '/tc/:documentId([0-9a-fA-F]{24})',
    method: 'GET',
    middleware: [ContentController.viewById]
}, {
    path: '/*',
    method: 'GET',
    middleware: [ContentController.viewByPath]
},{
    path: '/:documentId([0-9a-fA-F]{24})',
    method: 'POST',
    middleware: [ContentController.viewById]
},{
    path: '/tc/:documentId([0-9a-fA-F]{24})',
    method: 'POST',
    middleware: [ContentController.viewById]
}, {
    path: '/*',
    method: 'POST',
    middleware: [ContentController.viewByPath]
},{
    path: '/:documentId([0-9a-fA-F]{24})',
    method: 'PUT',
    middleware: [ContentController.viewById]
},{
    path: '/tc/:documentId([0-9a-fA-F]{24})',
    method: 'PUT',
    middleware: [ContentController.viewById]
}, {
    path: '/*',
    method: 'PUT',
    middleware: [ContentController.viewByPath]
},{
    path: '/:documentId([0-9a-fA-F]{24})',
    method: 'DELETE',
    middleware: [ContentController.viewById]
},{
    path: '/tc/:documentId([0-9a-fA-F]{24})',
    method: 'DELETE',
    middleware: [ContentController.viewById]
}, {
    path: '/*',
    method: 'DELETE',
    middleware: [ContentController.viewByPath]
}];

module.exports = {
	routes: routes
};