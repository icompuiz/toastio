'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	_ = require('lodash'),
	async = require('async'),
	argv = require('optimist').argv;
var statusService = require('../../components/status.service');


function AccessControlListPlugin(schema, options) {
	var UserAccessControlEntry = require('./api/useraccesscontrolentry.model');
	var GroupAccessControlEntry = require('./api/groupaccesscontrolentry.model');
	var AccessControlList = require('./api/accesscontrollist.model');

	options = options || {
		administrators: true
	};

	if (undefined === options.administrators) {
		options.administrators = true;
	}



	function verbosityControlledLog() {
		if (argv.debug) {
			console.log.apply(console, arguments);
		}
	}

	schema.add({ // Attach acls to existing schema
		acl: {
			ref: 'AccessControlList',
			type: mongoose.Schema.Types.ObjectId
		},
		aclInit: {} // this field is removed before saving the object
	});

	function checkCurrentUserRights(right, doneCheckingCurrentUserRights, currentUser) {
		var Group = mongoose.model('Group');

		if (argv.acl === 'off') {
			return doneCheckingCurrentUserRights(null,true);
		}

		right = right || 'read';

		/* jshint validthis: true */
		var data = this;

		currentUser = currentUser || statusService.session ? statusService.session.user : null;

		verbosityControlledLog('Checking acls for', currentUser.username, 'on resource', data.name);

		if (currentUser) {

			AccessControlList
				.findById(data.acl)
				.populate('userAccessControlEntries')
				.populate('groupAccessControlEntries')
				.exec(function(err, acl) {
					if (err) {
						return doneCheckingCurrentUserRights(err);
					}

					// verbosityControlledLog(acl);

					if (!acl) {
						var modelMissingError = new Error('ACL for model missing');
						return doneCheckingCurrentUserRights(modelMissingError);
					}

					function sendResult(err) {

						if (err) {
							return doneCheckingCurrentUserRights(err);
						}


						if (isAllowed) {
							verbosityControlledLog('User', currentUser.username, 'is allowed to', right, 'resource', data.name);

						} else {

							verbosityControlledLog('User', currentUser.username, 'is not allowed to', right, 'resource', data.name);
						}

						doneCheckingCurrentUserRights(null, isAllowed);
					}

					// note:
					// valid states
					// 1. match = true, isAllowed = true -> user has rights
					// 2. match = true, isAllowed = false -> user does not have rights
					// 3. match = false, isAllowed = false -> user does not have rights
					// invalid state
					// 4. match = false, isAllowed = true

					var isAllowed = false;
					// _.forEach(acl.userAccessControlEntries, function(userAccessControlEntry) {
					// 	if () {
					// 		match = true;
					// 		isAllowed = userAccessControlEntry.access[right];
					// 	}
					// });

					var foundUserccessControlEntry = _.find(acl.userAccessControlEntries, function(userAccessControlEntry) {
						return userAccessControlEntry.user.equals(currentUser._id);
					});

					if (foundUserccessControlEntry) {
						isAllowed = foundUserccessControlEntry.access[right];

						verbosityControlledLog('User', currentUser.username, 'is explicitly defined in user acl on', data.name, right, isAllowed);

						if (!isAllowed) { // don't do anything else no need to go on
							return sendResult();
						}
					}

					// var groupIds = _.pluck(acl.groupAccessControlEntries, 'group');
					// var groupACEIndex = _.indexBy(acl.groupAccessControlEntries, 'group')

					var groupIds = [];
					var groupACEIndex = {};

					acl.groupAccessControlEntries.forEach(function(groupACE) {
						groupIds.push(groupACE.group);
						groupACEIndex[groupACE.group] = groupACE;
					});

					Group
						.find({
							_id: {
								$in: groupIds
							},
							members: currentUser._id
						})
						.populate('members')
						.exec(function(err, groupDocs) {

							if (err) {
								return doneCheckingCurrentUserRights(err);
							}

							// console.log('Groups', groupDocs);
							// return console.log('Group Ids', groupIds);

							async.each(groupDocs, function(groupDoc, processNextGroupDoc) {

									verbosityControlledLog(groupDoc.name);

									var groupAccessControlEntry = groupACEIndex[groupDoc._id];

									// var foundMember = _.find(groupDoc.members, function(member) {
									// 	return member._id.equals(currentUser._id);
									// });

									// if (foundMember) {
									isAllowed = groupAccessControlEntry.access[right]; // and it so that all evaluate to true
									verbosityControlledLog('User', currentUser.username, 'is implicitly defined through group acl for group', groupDoc.name, 'on', data.name, right, isAllowed);

									if (!isAllowed) { // drop out immediately if group is not allowed 
										return processNextGroupDoc({
											denied: true
										});
										// }
									} else {
										verbosityControlledLog('User', currentUser.username, 'is not a member group ace', groupDoc.name);
									}

									processNextGroupDoc();
								},

								function(result) {
									if (result) {

										if (result.denied) {
											isAllowed = false;
										} else { // regular error, pass it along
											return sendResult(result);
										}

									}
									sendResult();
								});

						});

				});

		} else {
			var err = new Error('Did not find user');
			return doneCheckingCurrentUserRights(err);
		}

	}

	var isAllowed = checkCurrentUserRights;

	schema.methods.isAllowed = isAllowed;

	function resetACL(resetACLDoneCB) {

		var currentUser = statusService.session ? statusService.session.user : null;
		var User = mongoose.model('User');

		/* jshint validthis: true */
		var doc = this;
		var _self = this;


		// initialize the access control list
		function blankACL() {
			var list = new AccessControlList({
				modelId: doc._id,
				model: doc.constructor.modelName,
				userAccessControlEntries: [],
				groupAccessControlEntries: []
			});
			return list;
		}

		function deleteExistingAcl(deleteExistingAclTaskDone) {
			verbosityControlledLog('plugin::AccessControlListPlugin::resetAcldeleteExistingAcl::enter');

			var id = doc.acl._id || doc.acl || false;

			if (id) {
				AccessControlList.findById(id).exec(function(err, aclDoc) {


					if (err) {

						verbosityControlledLog('Error removing existing acl record', err, doc, doc.modelName);

						doc.acl = null;
						return deleteExistingAclTaskDone(err);


					} else if (!aclDoc) {


						var message = 'plugin::AccessControlListPlugin::resetAcl::deleteExistingAcl::err::Existing acl record not found::' + doc.acl + '::' + doc.constructor.modelName;
						verbosityControlledLog(message);

						err = new Error(message);

						doc.acl = null;
						// return deleteExistingAclTaskDone(err);

					} else {

						return aclDoc.remove(function(err) {

							doc.acl = null;

							deleteExistingAclTaskDone(err);

						});
					}

					deleteExistingAclTaskDone();

				});
			} else {
				return deleteExistingAclTaskDone();
			}
		}

		var waterfall = [];

		if (doc.acl) {

			verbosityControlledLog('plugin::AccessControlListPlugin::Existing acl detected');


			waterfall.push(deleteExistingAcl);

		}

		if (options.inheritFrom) {


			waterfall.push(function(nextTask) {

				var field = '';
				var modelName = '';

				if (_.isArray(options.inheritFrom)) {
					if (doc[options.inheritFrom[0].field]) {
						field = doc[options.inheritFrom[0].field];
						modelName = options.inheritFrom[0].model;
					} else if (options.inheritFrom.length > 1) {
						field = doc[options.inheritFrom[1].field];
						modelName = options.inheritFrom[1].model;
					}
				} else if (_.isObject(options.inheritFrom)) {
					field = doc[options.inheritFrom.field];
					modelName = options.inheritFrom.model;
				} else {
					return nextTask(null, blankACL());
				}

				var Model = mongoose.model(modelName);

				Model.findById(field).exec(function(err, inheritDoc) {
					if (err) {
						nextTask(err);
					} else if (!inheritDoc) {

						nextTask(null, blankACL());

					} else {

						AccessControlList.findById(inheritDoc.acl).exec(function(err, acl) {

							if (err) {
								nextTask(err);
							} else if (!acl) {
								nextTask(null, blankACL());
							} else {
								acl.duplicate(_self, nextTask);
							}
						});

					}

				});
			});
		} else {
			waterfall.push(function(nextTask) {
				nextTask(null, blankACL());
			});
		}




		function processAccessControlList(accessControlList, nextTask) {
			// helpful function to prevent duplicate code

			verbosityControlledLog('plugin::AccessControlListPlugin::processAccessControlList::enter', accessControlList.model, accessControlList.modelId);


			function saveAccessControlList(accessControlList, afterSave) {
				verbosityControlledLog('plugin::AccessControlListPlugin::processAccessControlList::saveAccessControlList::enter');

				accessControlList.save(function(err) {

					if (err) {
						verbosityControlledLog('plugin::AccessControlListPlugin::processAccessControlList::saveAccessControlList::err', err);
						return afterSave(err);
					}

					doc.aclInit = undefined; // remove the initialization data

					doc.acl = accessControlList;

					afterSave();

				});
			}

			// will iterate through a list of groups and create group aces for them if they exist

			function processGroups(accessControlList, groups, doneProcessingGroups) {

				var Group = mongoose.model('Group');


				async.each(groups, function(currentGroup, processNextGroup) {

					if (!currentGroup.name) {
						return processNextGroup(new Error('Group Access Control Entry without name specified'));
					}
					verbosityControlledLog('Looking for group', currentGroup.name);

					Group.findOne({
						name: currentGroup.name
					}, function(err, foundGroup) {
						if (err) {
							return processNextGroup(err);
						}

						if (foundGroup) {
							var groupAccessControlEntry = new GroupAccessControlEntry({
								acl: accessControlList._id,
								group: foundGroup,
								access: currentGroup.access
							});

							groupAccessControlEntry.save(function(err) {
								if (err) {
									return processNextGroup(err);
								}

								accessControlList.groupAccessControlEntries.push(groupAccessControlEntry);
								verbosityControlledLog('groupAccessControlEntry for', foundGroup.name, 'added successfully');

								processNextGroup();

							});
						} else {

							verbosityControlledLog('Group', currentGroup.name, 'not found.');
							processNextGroup(new Error('Group ' + currentGroup.name + ' not found'));
						}
					});

				}, doneProcessingGroups);

			}

			// will iterate through a list of users and create users aces for them if they exist

			function processUsers(accessControlList, users, doneProcessingUsers) {

				async.each(users, function(currentUser, processNextUser) {

					if (!currentUser.name) {
						return processNextUser(new Error('User Access Control Entry without name specified'));
					}

					verbosityControlledLog('Looking for user', currentUser.name);

					User.findOne({
						username: currentUser.name
					}, function(err, foundUser) {
						if (err) {
							return processNextUser(err);
						}

						if (foundUser) {
							var userAccessControlEntry = new UserAccessControlEntry({
								acl: accessControlList._id,
								user: foundUser,
								access: currentUser.access
							});

							userAccessControlEntry.save(function(err) {
								if (err) {
									return processNextUser(err);
								}

								accessControlList.userAccessControlEntries.push(userAccessControlEntry);

								verbosityControlledLog('userAccessControlEntry for', foundUser.username, 'added successfully');

								processNextUser();

							});
						} else {

							verbosityControlledLog('User', currentUser.name, 'not found.');
							processNextUser(new Error('User ' + currentUser.name + ' not found'));

						}
					});

				}, doneProcessingUsers);

			}



			function saveGroupACE(doneSaveGroupACE) {

				var Group = mongoose.model('Group');

				// find the administrators group
				Group.findOne({
					name: 'administrators'
				}, function(err, adminGroup) {
					if (err) {
						return doneSaveGroupACE(err);
					}

					// if the adminGroup does not exist
					if (!adminGroup) {
						var administratorNotFoundMsg = 'Critical error: administrators group not found';
						return doneSaveGroupACE(new Error(administratorNotFoundMsg));
					}



					// if all is well

					// create an ace for the administrators group
					var groupAccessControlEntry = new GroupAccessControlEntry({
						acl: accessControlList._id,
						group: adminGroup,
						access: {
							create: true,
							read: true,
							modify: true,
							remove: true
						}
					});

					accessControlList.groupAccessControlEntries.push(groupAccessControlEntry);

					groupAccessControlEntry.save(function(err) {

						if (err) {
							return doneSaveGroupACE(err);
						}

						doneSaveGroupACE(null, groupAccessControlEntry);

					});

				});


			}

			function saveUserACE(doneSavingUserACE) {

				// get the current user 
				// 	in dummydata - root
				//	in normal use - the user that is logged in
				if (!currentUser) {
					var currentUserNotFoundMsg = 'Critical error: user not found. Nothing else to do';
					verbosityControlledLog(currentUserNotFoundMsg);
					return doneSavingUserACE(new Error(currentUserNotFoundMsg));
				}

				// create an ace for the current user
				var userAccessControlEntry = new UserAccessControlEntry({
					acl: accessControlList._id,
					user: currentUser,
					access: {
						create: true,
						read: true,
						modify: true,
						remove: true
					}
				});

				accessControlList.userAccessControlEntries.push(userAccessControlEntry);

				userAccessControlEntry.save(function(err) {

					if (err) {
						return doneSavingUserACE(err);
					}

					doneSavingUserACE(null, userAccessControlEntry);


				});
			}

			function createGroups(doneCreatingGroups) {

				var Group = mongoose.model('Group');


				var groups = options.groups;
				var savedGroups = [];

				async.each(groups, function(groupData, createNextGroup) {

					var name = '';
					if (_.isFunction(groupData.name)) {
						name = groupData.name.call(doc);
					} else {
						name = doc._id;
					}

					if (_.isFunction(groupData.suffix)) {
						name = groupData.suffix.call(doc, name);
					} else if (_.isString(groupData.suffix)) {
						name += groupData.suffix;
					}

					var group = new Group({
						name: name
					});

					if (groupData.currentUser) {
						if (!_.isArray(group.members)) {
							group.members = [];
						}

						var currentUser = statusService.session ? statusService.session.user : null;
						group.members.push(currentUser);
					}

					group.save(function(err) {

						if (err) {
							createNextGroup(err);
						} else {

							savedGroups.push({
								name: name,
								access: groupData.access
							});

							createNextGroup();

						}

					});


				}, function(err) {

					if (err) {
						doneCreatingGroups(err);
					} else {
						processGroups(accessControlList, savedGroups, doneCreatingGroups);
					}

				});

			}

			var tasks = {};
			tasks.userACE = saveUserACE;

			if (options.administrators) {
				tasks.groupACE = saveGroupACE;
			}

			if (options.groups) {
				tasks.customGroups = createGroups;
			}

			async.series(tasks, function(err) {

				if (err) {
					return resetACLDoneCB(err);
				}

				// if doc acl has been initialized to something already
				if (doc.aclInit) {
					// if there are groups in this aclInit data definition
					if (doc.aclInit.groups) {

						processGroups(accessControlList, doc.aclInit.groups, function(err) { // defined earlier

							if (err) {
								return resetACLDoneCB(err);
							}

							// after groups have been processed, process users if there are users in the acl initialization data definition
							if (doc.aclInit.users) {

								processUsers(accessControlList, doc.aclInit.users, function(err) { // defined earlier
									if (err) {
										return resetACLDoneCB(err);
									}

									saveAccessControlList(accessControlList, nextTask);


								});

							} else { // otherwise just save the access control list

								saveAccessControlList(accessControlList, nextTask);

							}

						});

					} else if (doc.aclInit.users) { // if there are no groups defined but there are users defined

						processUsers(accessControlList, doc.aclInit.users, function(err) { // defined earlier
							if (err) {
								return resetACLDoneCB(err);
							}
							saveAccessControlList(accessControlList, nextTask);
						});

					}

				} else { // if no initialization data has been specified, simply save the defaults

					saveAccessControlList(accessControlList, nextTask);
				}
			});
		}

		waterfall.push(processAccessControlList);

		async.waterfall(waterfall, function(err) {
			resetACLDoneCB(err);
		});

	}

	schema.methods.resetACL = resetACL;


	schema.pre('save', resetACL);

	schema.pre('remove', function(done) {

		var doc = this;

		AccessControlList.findById(doc.acl).exec(function(err, acl) {
			if (err) {
				return done(err);
			}

			if (acl) {
				acl.remove(done);
			} else {
				done();
			}


		});

	});

	function grantUser(userDoc, grantUserDoneCB) {

		/* jshint validthis: true */
		var _this = this;

		if (!_this.acl) {
			var err = new Error('ACL property not defined for ACL controlled object');
			return grantUserDoneCB(err);
		}

		var userAccessControlEntry = new UserAccessControlEntry({
			acl: _this.acl,
			user: userDoc,
			access: {
				create: true,
				read: true,
				modify: true,
				remove: true
			}
		});
		userAccessControlEntry.save(function() {
			AccessControlList.findByIdAndUpdate(_this.acl, {
				$push: {
					userAccessControlEntries: userAccessControlEntry
				}
			}, function(err) {
				if (err) {
					return grantUserDoneCB(err);
				}
				grantUserDoneCB();
			});
		});

	}

	schema.methods.grantUser = grantUser;

}

module.exports = AccessControlListPlugin;
