'use strict';
var async = require('async'),
	_ = require('lodash');
var mongoose = require('mongoose');


var components = require('../../components');
var requestinterceptor = components.requestinterceptor;

exports.attach = function(GroupResource) {


	var Group = require('./group.model');

	GroupResource.before('get', function(req, res, next) {
		
		if (!req.params.id) {
			req.quer.where({
				name: {
					$nin: ['public', 'SYSTEM']
				}
			});
		}

		next();

	});

	GroupResource.before('post', function(req, res, next) {

		req.quer.populate('members');
		next();

	});

	GroupResource.before('put', function(req, res, next) {

		if (req.params.id) {
			Group.findOne({
				_id: req.params.id,
				system: true
			}).exec(function(err, systemGroup) {
				if (err) {
					return res.send(500, err.message || err);
				}

				if (!systemGroup) {
					return next();
				}

				if (systemGroup.name !== req.body.name) {

					err = new Error();
					err.message = {
						name: {
							errors: [{
								code:'err::model::group::name::systemgroup',
								msg:'err::model::group::name::systemgroup'
							}]
						}
					};
					return res.status(500).send(err);

				}

				next();
			});
		} else {
			next();
		}

	});

	// handle usersRemoved
	GroupResource.after('put', function(req, res, next) {

		if (req.params.id) {

			var group = req.params.id;

			if (_.isArray(req.body.usersRemoved)) {
				var User = mongoose.model('User');

				async.each(req.body.usersRemoved, function removeFromGroup(user, removeFromGroupTaskDoneCB) {

					var id = user;
					if (_.isObject(user)) {
						id = user._id;
					}

					User.findByIdAndUpdate(id, {
						$pull: {
							groups: group
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

	// handle usersAdded
	GroupResource.after('put', function(req, res, next) {

		if (req.params.id) {

			var group = req.params.id;

			if (_.isArray(req.body.usersAdded)) {
				var User = mongoose.model('User');

				async.each(req.body.usersAdded, function addToGroup(user, addToGroupTaskDoneCB) {

					var id = user;
					if (_.isObject(user)) {
						id = user._id;
					}

					User.findByIdAndUpdate(id, {
						$push: {
							groups: group
						}
					}).exec(addToGroupTaskDoneCB);

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

	requestinterceptor.interceptDelete(GroupResource, Group);

};
