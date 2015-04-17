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
var _ = require('lodash');

var User = require('./user.model');
var UserController = require('./user.controller');

var UserResource = restful
	.model(User.modelName, User.schema)
	.methods(['get', 'put', 'delete', 'post']);

UserController.attach(UserResource);

function nodeRestfulRegister(app, url) {
	UserResource.addDefaultRoutes();
	app.getDetail = app.get;
	UserResource.registerRoutes.call(UserResource, app, url, '', UserResource.routes);
}

module.exports = {
	register: nodeRestfulRegister,
	resource: UserResource,
	controller: UserController,
	model: User
};
