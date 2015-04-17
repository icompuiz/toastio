'use strict';

var mongoose = require('mongoose-bird')();
var config = require('./environment');


var mongoOptions = {
	db: {
		safe: true
	}
};

var connect = function connect(onDbConnected) {

	mongoose.connect(config.mongo.uri, config.mongo.options, function(err, res) {
		if (err) {
			console.log('ERROR connecting to: ' + config.mongo.uri + '. ' + err);
			onDbConnected(err);
		} else {
			console.log('Successfully connected to: ' + config.mongo.uri);
			onDbConnected(null, res);
		}
	});
};

module.exports = {
	connect: connect
};