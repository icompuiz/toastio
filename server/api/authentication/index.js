'use strict';
var AuthenticationController = require('./authentication.controller');
var components = require('../../components');

var routes = [{
	path: '/register',
	method: 'POST',
	middleware: AuthenticationController.register
}, {
	path: '/login',
	method: 'POST',
	middleware: AuthenticationController.login
}, {
	path: '/logout',
	method: 'POST',
	middleware: AuthenticationController.logout
}, {
	path: '/api/command/who',
	middleware: components.commands.whoami,
	method: 'GET'
}];

module.exports = {
	routes: routes
};
