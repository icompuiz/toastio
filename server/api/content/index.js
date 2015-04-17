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
    path: '/:contentId([0-9a-fA-F]{24})',
    method: 'GET',
    middleware: [ContentController.viewById]
}, {
    path: '/*',
    method: 'GET',
    middleware: [ContentController.viewByPath]
}];

module.exports = {
	routes: routes
};