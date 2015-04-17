'use strict';
var buildStatus = require('../seedUtils').buildStatus;


// Route access control definitions. These ACOs are used to verify that a particular user as access to a particular route.

// Default Access control definitions
// name - the name of the group
// access - the access levels (read/create)

var pub = {
	name: 'public',
	access: {
		read: true,
		create: true
	}
};
var admin = {
	name: 'administrators',
	access: {
		read: true,
		create: true
	}
};
var users = {
	name: 'users',
	access: {
		read: true,
		create: true
	}
};

var all = [admin, users, pub];
var authenticated = [admin, users];

var routes = {};

module.exports = routes;
