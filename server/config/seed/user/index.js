'use strict';
var buildStatus = require('../seedUtils').buildStatus;


var mongoose = require('mongoose');
var async = require('async');
var _ = require('lodash');

var seedData = require('./seedData.js');
var userData = seedData.all;
var rootUserData = seedData.root;
var publicUserData = seedData.public;

function removeUsers(cb) {

	var User = mongoose.model('User');

	User.find({}, function(err, users) {

		if (err) {
			return cb(err, buildStatus('User', 'Remove', 'All', err));
		}

		if (!users) {
			return cb(err, buildStatus('User', 'Remove', 'All', 'No Users'));
		}

		async.each(users, function(user, next) {

				user.remove(function(err) {
					if (err) {
						return next(err);
					}
					console.log('Removed user', user.username);
					next();
				});
			},
			function(err) {

				cb(err, buildStatus('User', 'Remove', 'All', err));
			});
	});
}


function addUser(userObj, cb) {

	var User = mongoose.model('User');
	var Group = mongoose.model('Group');

	var password = userObj.password; // Copy password as we pass this seprately so it can be hashed

	// lets convert the array of groups to the corresponding ids
	function mapUserGroups(mapUserGroupsTaskDoneCB) {

		function mapUserGroupTask(group, mapUserGroupTaskDoneCB) {
			Group.findOne({
				name: group
			}).exec(function(err, groupDoc) {

				if (err) {
					return mapUserGroupTaskDoneCB(err);
				}

				if (!groupDoc) {
					return mapUserGroupTaskDoneCB();
				}

				mapUserGroupTaskDoneCB(null, groupDoc._id);

			});
		}

		function mapUserGroupsMapFinally(err, groups) {
			if (err) {
				return mapUserGroupsTaskDoneCB(err);
			}

			var userData = _.omit(userObj, 'password');
			userData.groups = groups;
			mapUserGroupsTaskDoneCB(err, userData);
		}

		if (userObj.groups) {

			async.map(userObj.groups, mapUserGroupTask, mapUserGroupsMapFinally);

		} else {
			mapUserGroupsTaskDoneCB(null, userObj);
		}

	}

	function registerUser(userData, registerUserTaskDoneCB) {

		User.register(
			new User(userData),
			password,
			function(err) {
				registerUserTaskDoneCB(err);
			}
		);

	}

	function addUserWaterfallFinally(err) {
		cb(err, buildStatus('AddUser', 'Register', userObj.username, err));

	}

	var tasks = [mapUserGroups, registerUser];

	async.waterfall(tasks, addUserWaterfallFinally);

}

function addRootUser(cb) {

	var User = mongoose.model('User');


	addUser(rootUserData, function(err, result) {
		if (err) {
			return cb(err, result);
		}

		User.findOne({
			username: rootUserData.username
		}, function(err, root) {

			if (err) {
				return cb(err, result);
			}

			if (!root) {
				console.log('Root not found');
				return cb(new Error('Root not found'), buildStatus('AddRootUser', 'Find', 'Root'));
			}

			root.resetACL(function(err) {

				if (err) {
					return cb(err, buildStatus('User', 'AddUsers', 'Root', err));
				}

				root.update({acl: root.acl}, null, function() {
					cb(err, buildStatus('User', 'AddUsers', 'Root', err));
				});

			});

		});
	});

}

function addPublicUser(cb) {
	var User = mongoose.model('User');

	addUser(publicUserData, function(err, result) {
		if (err) {
			return cb(err, result);
		}

		User.findOne({
			username: publicUserData.username
		}, function(err, publicUser) {

			if (err) {
				return cb(err, result);
			}

			if (!publicUser) {
				console.log('Public not found');
				return cb(new Error('Public not found'), buildStatus('AddPublicUser', 'Find', 'Public'));
			}

			cb(err, buildStatus('User', 'AddUsers', 'Public', err));

		});
	});

}

function addUsers(cb, data) {
	data = data || userData;
	var arrayOfFunc = [];
	_.forEach(data, function(userObj) {
		arrayOfFunc.push(function(callback) {
			addUser(userObj, callback);
		});
	});
	async.parallel(
		arrayOfFunc,
		function(err) {
			cb(err, buildStatus('User', 'AddUsers', 'All', err));
		}
	);
}

exports.remove = removeUsers;
exports.addRootUser = addRootUser;
exports.addPublicUser = addPublicUser;
exports.addUsers = addUsers;