'use strict';
var _ = require('lodash');
var mongoose = require('mongoose');
var async = require('async');
var components = require('../../components');
var apiUtils = components.apiUtils,
	requestinterceptor = components.requestinterceptor;

exports.attach = function(UserResource) {

	var User = require('./user.model');

	apiUtils.addPermissionChecks(UserResource, User);


	UserResource.before('get', function(req, res, next) {
		console.log('req.query.select');
		if (!req.query.select) {
			req.quer.select('-hash -salt');
		} else {
			if (req.query.select.match(/(hash|salt)/g)) {
				return res.send(500, 'Invalid restriction criteria');
			}
			req.quer.select(req.query.select);
		}
		console.log(req.query.select);

		if (!req.params.id) {
			req.quer.where({
				system: {
					$ne: true
				}
			});
		}

		next();

	});

	UserResource.before('post', function(req, res, next) {

		req.quer.populate('groups');
		next();

	});

	function cleanRequest(req, res, next) {
		console.log(res.locals.bundle);

		if (_.isArray(res.locals.bundle)) {
			res.locals.bundle = _.map(res.locals.bundle, function(item) {
				if (item) {
					item.hash = undefined;
					item.salt = undefined;
					item.password = undefined;
				}
				return item;
			});
		} else {
			if (res.locals.bundle) {
				res.locals.bundle.hash = undefined;
				res.locals.bundle.salt = undefined;
				res.locals.bundle.password = undefined;
			}
		}
		console.log(res.locals.bundle);
		next();
	}

	UserResource.after('get', cleanRequest);
	UserResource.after('post', cleanRequest);
	UserResource.after('put', cleanRequest);

	UserResource.before('put', function checkAndSetPassword(req, res, next) {

		// return;

		if (req.params.id && (req.body.password && req.body.passwordConfirm)) {
			var id = req.params.id;
			User.findById(id).exec(function(err, user) {
				if (err) {
					return next(err);
				}

				if (!user) {
					err = new Error('User not found');
					return next(err);
				}

				var password = req.body.password;
				var confirm = req.body.passwordConfirm;

				if (password === confirm) {
					return user.setPassword(req.body.password, function(err, user) {
						if (err) {
							return next(err);
						}

						// req.body = user.toObject();

						req.body.salt = user.salt;
						req.body.hash = user.hash;

						return next();

						// console.log(user);
					});
				} else {
					err = new Error();
					err.name = 'err::model::user::Validation Error';
					err.message = {
						passwordConfirm: 'err::model::user::password::match'
					};
					return res.status(500).send(err);
				}

			})
		} else if (req.params.id && req.body.password) {
			var err = new Error();
			err.name = 'err::model::user::Validation Error';
			err.message = {
				passwordConfirm: {
					errors: [{
						code:'err::model::user::password::match',
						msg:'err::model::user::password::match'
					}]
				}
			};
			return res.status(500).send(err);

		} else {
			next();
		}


	});

	UserResource.before('put', function(req, res, next) {

		if (req.params.id) {
			User.findOne({
				_id: req.params.id,
				system: true
			}).exec(function(err, systemAccount) {
				if (err) {
					return res.send(500, err.message || err);
				}

				if (!systemAccount) {
					return next();
				}

				console.log('systemAccount', systemAccount);

				if (systemAccount.username !== req.body.username) {

					err = new Error('System Accounts cannot be renamed');
					return res.send(500, err.message || err);

				}

				next();
			});
		} else {
			next();
		}

	});


	// handle removedFrom
	UserResource.after('put', function(req, res, next) {

		if (req.params.id) {

			var user = req.params.id;

			if (_.isArray(req.body.removedFrom)) {
				var Group = mongoose.model('Group');

				async.each(req.body.removedFrom, function removeFromGroup(group, removeFromGroupTaskDoneCB) {

					var id = group;
					if (_.isObject(group)) {
						id = group._id;
					}

					Group.findByIdAndUpdate(id, {
						$pull: {
							members: user
						}
					}).exec(removeFromGroupTaskDoneCB);

				}, function finishedRemovingFromGroup(err) {
					next(err);
				});

			} else {
				next();
			}

		} else {
			next();
		}

	});



	// handle addedTo
	UserResource.after('put', function(req, res, next) {

		if (req.params.id) {
			var user = req.params.id;

			if (_.isArray(req.body.addedTo)) {
				var Group = mongoose.model('Group');

				async.each(req.body.addedTo, function addToGroup(group, addToGroupTaskDoneCB) {

					var id = group;
					if (_.isObject(group)) {
						id = group._id;
					}

					Group.findByIdAndUpdate(id, {
						$push: {
							members: user
						}
					}).exec(addToGroupTaskDoneCB);

				}, function finishedAddingToGroup(err) {
					next(err);
				});

			} else {
				next();
			}
		} else {
			next();
		}

	});

	requestinterceptor.interceptDelete(UserResource, User);

};
