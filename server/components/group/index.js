'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	extend = require('jquery-extend'),
	_ = require('lodash');


function GroupComponent(schema, options) {
	
	var Group = mongoose.model('Group');

	var defaults = {
		associateModel: false,
		'displayField': '_id'
	};
	options = extend(true, defaults, options);



	schema.add({
		group: {
			ref: 'Group',
			type: mongoose.Schema.Types.ObjectId
		}
	});

	schema.pre('save', function(preSaveDone) {


		var name = '';
		if (_.isFunction(options.name)) {
			name = options.name.call(this);
		} else {
			name = this[options.displayField] || defaults.displayField;
		}

		var group = new Group({
			name: name
		});

		this.group = group;

		if (options.associateModel) {

			group.members.push(this);

		}

		group.save(function(err) {

			if (err) {
				console.log('Unexpected error adding user', name, 'to default group', group.name);
				preSaveDone(err);
			}
			console.log('Group created for model', name);
			preSaveDone();
		});

	});

}

module.exports = GroupComponent;