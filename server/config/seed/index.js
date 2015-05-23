/**
 * Populate DB with sample data on server start

 */

'use strict';
var async = require('async');
var buildStatus = require('./seedUtils').buildStatus;

// Insert seed task below
var route = require('./routes');
var accesscontrol = require('./accesscontrol');
var filesystemFile = require('./filesystem.file');
var filesystemDirectory = require('./filesystem.directory');
var user = require('./user');
var group = require('./group');
var misc = require('./misc');
	
var tasks = {
	'removeAccessControlLists': accesscontrol.removeAccessControlLists,
	'removeAccessControlEntries': accesscontrol.removeAccessControlEntries,
	'removeFiles': filesystemFile.remove,
	'removeDirectories': filesystemDirectory.remove,
	'removeRoutes': route.remove,
	'removeUsers': user.remove,
	'removeGroups': group.remove,
	'removeMisc': misc.remove,
	'addGroups': group.add,
	'addRootUser': user.addRootUser,
	'addPublicUser': user.addPublicUser,
	'addUsers': user.addUsers, // Depends on Roles
	'addRoutes': route.add,
	'addRootDirectory': filesystemDirectory.root
};

function seedApplication(seedApplicationCB) {
	
	async.series(tasks, function(err, results) {
			console.log('InitDB::AsyncFinish::Results=\n\n', results, '\n');
			buildStatus('InitDB', 'AsyncFinish', 'AllStatus', err);
			seedApplicationCB();
	});

}

module.exports = {
	all: seedApplication,
	tasks: tasks
};