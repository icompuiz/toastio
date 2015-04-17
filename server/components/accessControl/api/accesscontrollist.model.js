'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	async = require('async'),
	_ = require('lodash'),
	Schema = mongoose.Schema;


var nesting = require('../../nesting');

var AccessControlListSchema = new Schema({
	modelId: {
		type: mongoose.Schema.Types.ObjectId
	},
	model: {
		type: String
	},
	userAccessControlEntries: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'UserAccessControlEntry'
	}],
	groupAccessControlEntries: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'GroupAccessControlEntry'
	}]
});


AccessControlListSchema.plugin(nesting.deleteChildren, {
	childModel: 'AccessControlEntryBase',
	parentField: 'acl'
});

AccessControlListSchema.statics.addGroups = function(id, groupsToAdd, done) {

	var Group = mongoose.model('Group'),
		GroupAccessControlEntry = mongoose.model('GroupAccessControlEntry');

	var ACL = this;
	ACL.findOne({
		_id: id
	}).exec(function(err, acl) {

		if (err) {
			return done(err);
		}

		if (!acl) {
			return done('ACL ' + id + ' not found');
		}

		var groups = [];
		async.each(groupsToAdd || [], function(groupData, processNextGroup) {

			var name = groupData.name || groupData;

			var groupQuery = Group.findOne({
				name: name
			});

			groupQuery.exec(function(err, group) {
				if (err) {
					return processNextGroup(err);
				}

				if (!group) {
					return processNextGroup('Group ' + name + ' not found');
				}


				var ace = new GroupAccessControlEntry({
					group: group._id,
					acl: id
				});

				if (groupData.access) {
					ace.access = groupData.access;
				}

				ace.save(function(err) {
					if (err) {
						return processNextGroup(err);
					}

					groups.push(ace._id);
					processNextGroup();
				});

			});


		}, function(err) {
			if (err) {
				return done(err);
			}

			ACL.findOneAndUpdate({
				_id: id
			}, {
				$push: {
					groupAccessControlEntries: {
						$each: groups
					}

				}
			}, {
				safe: true
			}, function(err) {


				if (err) {
					return done(err);
				}
				done(null, groups);
			});
		});

	});

};

AccessControlListSchema.methods.duplicate = function(doc, callback) {

	var self = this;

	var GroupAccessControlEntry = mongoose.model('GroupAccessControlEntry');
	var UserAccessControlEntry = mongoose.model('UserAccessControlEntry');

	var tasks = {};

	var AccessControlList = self.constructor;

	var accessControlList = new AccessControlList({
		modelId: doc._id,
		model: doc.constructor.modelName
	});

	tasks.groupAccessControlEntries = function(nextTask) {

		var groupAccessControlEntries = [];
		async.each(self.groupAccessControlEntries, function(groupAce, duplicateNext) {

			GroupAccessControlEntry.findById(groupAce).populate('group').exec(function(err, groupaceDoc) {

				if (err) {
					duplicateNext(err);
				} else if (!groupaceDoc) {
					duplicateNext();
				} else if (groupaceDoc.group.system) {
					duplicateNext();
				} else {

					console.log('Access Level', groupaceDoc.access);
					var duplicatedACE = new GroupAccessControlEntry({
						acl: accessControlList._id,
						access: _.clone(groupaceDoc.access),
						group: groupaceDoc.group
					});

					duplicatedACE.save(function(err) {
						if (err) {
							duplicateNext(err);
						} else {
							groupAccessControlEntries.push(duplicatedACE._id);
							duplicateNext();
						}
					});
				}

			});

		}, function(err) {
			nextTask(err, groupAccessControlEntries);
		});
	};

	tasks.userAccessControlEntries = function(nextTask) {
		var userAccessControlEntries = [];
		var currentUser = components.statusService.session ? components.statusService.session.user : { _id: null };


		async.each(self.userAccessControlEntries, function(userace, duplicateNext) {

			UserAccessControlEntry.findById(userace).populate('user').exec(function(err, useaceDoc) {

				
				
				if (err) {
					duplicateNext(err);
				} else if (!useaceDoc) {
					duplicateNext();
				} else if (useaceDoc.user.system) {
					duplicateNext();
				} else if (useaceDoc.user._id.equals(currentUser._id)) {
					duplicateNext();
				} else {

					var duplicatedACE = new UserAccessControlEntry({
						acl: accessControlList._id,
						access: _.clone(useaceDoc.access),
						user: useaceDoc.user
					});

					duplicatedACE.save(function(err) {
						if (err) {
							duplicateNext(err);
						} else {
							userAccessControlEntries.push(duplicatedACE._id);
							duplicateNext();
						}
					});
				}
			});

		}, function(err) {
			nextTask(err, userAccessControlEntries);
		});
	};

	async.series(tasks, function(err, results) {

		if (err) {
			callback(err);
		} else {
			accessControlList.userAccessControlEntries = results.userAccessControlEntries;
			accessControlList.groupAccessControlEntries = results.groupAccessControlEntries;

			callback(null, accessControlList);
		}

	});

};

module.exports = mongoose.model('AccessControlList', AccessControlListSchema);