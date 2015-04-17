'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	_ = require('lodash'),
	extend = require('jquery-extend');


function makeid(len) {
	len = len || 5;
	var text = '';
	var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

	for (var i = 0; i < len; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;

}

function DirectoryPlugin(schema, options) {

	var defaults = {
		'displayField': '_id',
		prefix: false,
		suffix: false,
		name: false
	};
	options = extend(true, defaults, options);

	schema.add({
		directory: {
			ref: 'FileSystemDirectory',
			type: mongoose.Schema.Types.ObjectId
		}
	});

	schema.pre('remove', function(done) {

		console.log('plugin::directoryPlugin::pre::remove::enter');
		if (!this.directory) {
			console.log('plugin::directoryPlugin::pre::remove::', 'directory field not set');
			return done();
		}

		var Directory = mongoose.model('FileSystemDirectory');

		Directory.findById(this.directory).exec(function(err, directory) {

			if (err) {
				return done(err);
			}

			if (!directory) {
				return done();
			}
			console.log('plugin::directoryPlugin::pre::remove::findById::', directory.name);


			directory.remove(done);

		});

	});

	schema.pre('save', function(next) {

		var name = '';
		var doc = this;

		doc.constructor.findById(doc._id).exec(function(err, model) {

			if (err) {
				return next(err);
			}

			if (model) {
				return next();
			}

			if (doc.directory) {
				// console.log('DirectoryPlugin::Model::', doc._id);
				return next();
			}

			if (options.name) {
				name = options.name.call(doc);

			} else {
				name = doc[options.displayField] || defaults.displayField;
			}

			if (options.prefix) {
				if (typeof options.prefix === 'boolean') {

					options.prefix = makeid();

				}

				if (_.isFunction(options.prefix)) {
					name = options.prefix.call(doc, name);
				} else {
					name = options.prefix + name;
				}

			}

			if (options.suffix) {

				if (typeof options.suffix === 'boolean') {

					options.suffix = makeid();

				}

				if (_.isFunction(options.suffix)) {
					name = options.suffix.call(doc, name);
				} else {
					name = options.suffix + name;
				}
			}

			var Directory = mongoose.model('FileSystemDirectory');
			var directory = new Directory({
				name: name
			});

			if (options.field)
				directory[options.field] = doc._id;

			doc.directory = directory;

			directory.save(function(err) {
				console.log('directoryPlugin:save:enter', name);

				if (err) {
					console.log('directoryPlugin:save:Error while saving new directory with name=', name);

					return next(err);
				}
				console.log('directoryPlugin:save:Directory created successfully with name', name);
				return next();
			});

		});


	});

}

module.exports = DirectoryPlugin;
