'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose');
//	ObjectID = mongoose.mongo.BSONPure.ObjectID,
//	Schema = mongoose.Schema,
//	_ = require("lodash"),
//	async = require('async');

//var extend = require('mongoose-schema-extend');

var AccessControlEntryBase = require('./accesscontrolentrybase.model');

var GroupAccessControlEntrySchema = AccessControlEntryBase.schema.extend({
	group: {
		ref: 'Group',
		type: mongoose.Schema.Types.ObjectId
	}
});

var GroupAccessControlEntry = mongoose.model('GroupAccessControlEntry', GroupAccessControlEntrySchema);

module.exports = GroupAccessControlEntry;

