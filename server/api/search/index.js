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

var SearchController = require('./search.controller');

var routes = [{
	path: '/api/search',
	middleware: SearchController.search,
	method: 'POST'
}];

module.exports = {
	routes: routes
};