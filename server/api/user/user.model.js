'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
var async = require('async');
var _ = require('lodash');
var check = require('validator').check;
var validate = require('mongoose-validator');
var components = require('../../components');

var fullNameValidator = [
	validate({
		validator: 'isLength',
		passIfEmpty: true,
		arguments: [3, 50],
		message: 'Name should be between 3 and 50 characters'
	})
];

var UserSchema = new Schema({
	system: {
		type: Boolean,
		default: false
	},
	fullName: {
		type: String,
		validate: fullNameValidator
	},
	organization: {
		type: String,
		default: null
	},
	comments: {
		type: String,
		default: null
	},
	password: String,
	address: {
		addr1: {
			type: String,
			default: null
		},
		addr2: {
			type: String,
			default: null
		},
		city: {
			type: String,
			default: null
		},
		stateProv: {
			type: String,
			default: null
		},
		postalCode: {
			type: String,
			default: null
		},
		country: {
			type: String,
			default: null
		},
	},
	groups: [{
		ref: 'Group',
		type: mongoose.Schema.Types.ObjectId
	}],
	mruOrgs: [{
		ref: 'Org',
		type: mongoose.Schema.Types.ObjectId
	}]
});

UserSchema.statics = {
	validate: function(user) {
		check(user.username, 'Username must be 1-20 characters long').len(1, 20);
		check(user.password, 'Password must be 5-60 characters long').len(5, 60);
		// check(user.username, 'Invalid username').not(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/);
	}
};

UserSchema.pre('save', function(next) {
	var _this = this;

	if (components.statusService.initializing && (_this.username === 'root' && _this.system === true)) {
		if (!components.statusService.session) {
			components.statusService.session = {};
		}


		components.statusService.session.user = _this;
	}
	next();

});


UserSchema.plugin(components.accessControl);

UserSchema.pre('save', function(next) {

	var doc = this;

	if (components.statusService.initializing) {
		return next();
	}


	var blacklist = /(root|public)/g;

	if (doc.username.match(blacklist)) {
		var err = new Error('The specified username is invalid');
		return next(err);
	}


	next();

});

UserSchema.pre('remove', function(next) {
	var doc = this;
	if (components.statusService.initializing) {
		return next();
	}

	if (doc._id) {
		doc.constructor.findOne({
			_id: doc._id,
			system: true
		}).exec(function(err, systemAccount) {
			if (err) {
				return next(err);
			}

			if (systemAccount) {
				err = new Error('System Accounts cannot be removed');
				return next(err);
			}

			next();
		});
	} else {
		next();
	}

});


UserSchema.pre('save', function(next) {
	var doc = this;
	//console.log('PreSave: ',this);
	mongoose.models.User.findOne({
		username: doc.username
	}, function(err, user) {
		// if(user) console.log('User ID',user._id);
		// if(doc) console.log('Doc ID',doc._id);
		if (err) {
			return next(err);
		} else if (user && String(user._id) !== String(doc._id)) {
			var errorMessage = 'This username is already taken';
			//console.log(errorMessage,doc);

			doc.invalidate('username', errorMessage, doc.username); // This sets username as invalid
			doc.validate(function(errValidate) { //We need to force it to run validation again
				if (errValidate) {
					return next(errValidate);
				} // If it is valid, which it should be at this point, return the error object
				return next(); // Unlikely to reach here
			});

		} else {
			console.log('This username is fine');
			async.series([

				function(nextTask) {
					if (doc.get('password')) {
						console.log('Set new password');
						var password = doc.get('password');
						doc.set('password', undefined);
						doc.setPassword(password, function(err) {
							if (err) {
								nextTask(err);
							} else {
								console.log('Password has been set');
								nextTask();
							}
						});
					} else {
						console.log('Didn\'t find password in doc');
						nextTask();
					}
				}
			], next);
		}
	});
});

UserSchema.pre('save', function addUserToGroups(addUserToGroupsTaskDoneCB) {

	var doc = this;
	var Group = mongoose.model('Group');

	function addUserToEachGroup(groupId, addUserToEachGroupTaskDoneCB) {

		Group.findByIdAndUpdate(groupId, {
			$addToSet: {
				members: doc._id
			}
		}).exec(function(err) {
			if (err) {
				return addUserToEachGroupTaskDoneCB(err);
			}

			addUserToEachGroupTaskDoneCB();
		});

	}

	if (doc.groups) {

		async.each(doc.groups, addUserToEachGroup, addUserToGroupsTaskDoneCB);

	} else {
		addUserToGroupsTaskDoneCB();
	}

});

UserSchema.pre('save', function(next) {
	var _this = this;
	_this.grantUser(_this, next);
});


UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);
