'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	ObjectId = mongoose.Schema.Types.ObjectId;

require('mongoose-schema-extend');

var AccessControlEntryBase = require('./accesscontrolentrybase.model');

var UserAccessControlEntrySchema = AccessControlEntryBase.schema.extend({
	user: {
		ref: 'User',
		type: ObjectId
	}
});

var UserAccessControlEntry = mongoose.model('UserAccessControlEntry', UserAccessControlEntrySchema);

module.exports = UserAccessControlEntry;

