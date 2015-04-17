'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	validate = require('mongoose-validator'),
	async = require('async');
var components = require('../../components');

var nameValidator = [
	validate({
		validator: 'isLength',
		arguments: [3, 50],
		message: 'Name should be between 3 and 50 characters'
	})
];

var GroupSchema = new Schema({
	system: {
		type: Boolean,
		default: false
	},
	name: { type: String, required: true, validate: nameValidator },
	org: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Org'
	},
	comments: String,
	members: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	}]
});

GroupSchema.pre('save', function(next) {

	var doc = this;

	if (components.statusService.initializing) {
		return next();
	}

		var blacklist = /(administrators|public|users)/g;

		if (doc.name.match(blacklist)) {
			var err = new Error('The specified name is invalid');
			return next(err);
		}

	next();

});

GroupSchema.pre('remove', function( next) {
	var doc = this;

	if (components.statusService.initializing) {
		return next();
	}

	if (doc._id) {

		doc.constructor.findOne({
			_id: doc._id,
			system: true
		}).exec(function(err, systemGroup) {
			if (err) {
				return next(err);
			}

			if (systemGroup) {
				err = new Error('System Groups cannot be removed');
				return next(err);
			}
			
			next();
		});
	} else {
		next();
	}

});

GroupSchema.pre('remove', function(next) {
	var doc = this;
	var GroupAccessControlEntry = mongoose.model('GroupAccessControlEntry');

	var aceQuery = GroupAccessControlEntry.find({
		group: doc._id
	});

	console.log('model:Group:pre:remove:enter');


	aceQuery.exec(function(err, aces) {

		async.each(aces, function(ace, removeNextACE) {

			ace.remove(removeNextACE);

		}, next);

	});


});

GroupSchema.pre('save', function addGroupsToMembers(addGroupsToMembersTaskDoneCB) {

	var doc = this;

	var User = mongoose.model('User');

	function addEachGroupToMemberTask(userId, addEachGroupToMemberTaskDoneCB) {

		User.findByIdAndUpdate(userId, {
			$addToSet: {
				groups: doc._id
			}
		}).exec(function(err) {
			if (err) {
				return addEachGroupToMemberTaskDoneCB(err);
			}

			addEachGroupToMemberTaskDoneCB();
		});

	}

	if (doc.members) {

		async.each(doc.members, addEachGroupToMemberTask, addGroupsToMembersTaskDoneCB);

	} else {
		addGroupsToMembersTaskDoneCB();
	}

});

var Group = mongoose.model('Group', GroupSchema);

module.exports = Group;