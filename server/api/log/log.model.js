'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

// Schema
var LogEntrySchema = new Schema({
	type: String,
	createTS: { type: Date, default: Date.now },
	msg: String,
	source: String,
	user: String,
	sTrace: String,
	//cause: String,
	updateTS: { type: Date, default: Date.now },
});
var components = require('../../components');

LogEntrySchema.plugin(components.accessControl);

module.exports = mongoose.model('Log', LogEntrySchema);