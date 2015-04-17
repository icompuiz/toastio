'use strict';
/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;


var AccessControlEntrySchema = new Schema({
	acl: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'AccessControlList'
	},
	access: {
		create: {
			type: Boolean,
			default: false
		},
		read: {
			type: Boolean,
			default: false
		},
		modify: {
			type: Boolean,
			default: false
		},
		remove: {
			type: Boolean,
			default: false
		}
	}
}, {
	collection: 'accesscontrolentries'
});

AccessControlEntrySchema.pre('remove', function(next) {

	var doc = this;

	console.log('model:AccessControlEntry:pre:remove:enter');

	var AccessControlList = mongoose.model('AccessControlList');

	AccessControlList.findOneAndUpdate({
		_id: doc.acl
	}, {
		$pull: {
			groupAccessControlEntries: doc._id,
			userAccessControlEntries: doc._id
		}
	}, function() {
		next();
	});

});

var AccessControlEntrySchema;

module.exports = AccessControlEntrySchema = mongoose.model('AccessControlEntryBase', AccessControlEntrySchema); // registered but not directly accessible
