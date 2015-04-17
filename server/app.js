/**
 * Main application file
 */

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var argv = require('optimist').argv;
var express = require('express');
var config = require('./config/environment');
var app = express();
var server = require('http').createServer(app);

function connectServer() {


	var port = argv.port || config.port;
	var ip = argv.ip || config.ip;

	// Start server
	function startServer() {
		server.listen(port, ip, function() {
			console.log('Express server listening on %d, in %s mode', port, app.get('env'));
		});
	}

	setImmediate(startServer);
}

// Connect to MongoDB
require('./config/mongodb').connect(function() {

	global.locks = {};
	// Setup server

	var components = require('./components');
	components.statusService.initializing = true;


	require('./config/express')(app);
	require('./routes')(app);
	require('./config/commandline').parse(app, function(err, runServer) {

		components.statusService.initializing = false;

		if (!runServer) {
			return process.exit();
		}

		connectServer();

	});

});
// Expose app
exports = module.exports = app;
