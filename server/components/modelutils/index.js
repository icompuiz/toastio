'use strict';
var _ = require('lodash'),
		async = require('async');
var statusService = require('../status.service');

module.exports = {
	model: {},
	controller: {}
};
var sf = JSON.stringify;

function isUnique(Model, paths, callback) {
	/* jshint validthis: true */
	var _this = this;
	var schema = Model.schema;

	var errors = {};

	async.each(paths, function(path, taskNextPath) {
		var thisValue = _this[path];
		var conditions = {};
		conditions[path] = thisValue;
		
		if (_this._id) {
			conditions._id = {
				$ne: _this._id
			};
		}

		var property = schema.tree[path];
		if (_.isObject(property.noduplicate)) {
			var parent = property.noduplicate.parent;
			if (parent) {
				conditions[parent] = _this[parent];
			}
		}

		console.log(sf(conditions));

		Model.count(conditions, function(err, count) {

			if (err) {
				return taskNextPath(err);
			} else if (count) {
				err = new Error();
				err.type = 'unique';
				err.path = path;
				err.message = 'An item with this `' + path + '` already exists';
				err.value = thisValue;
				errors[path] = err;
				return taskNextPath();
			} else {
				taskNextPath();
			}

		});
	}, function(err) {
		if (err) {
			callback(err);

		} else if (_.keys(errors).length) {
			err = new Error();
			err.message = 'Duplicate Key::' + JSON.stringify(errors);
			err.name = 'DuplicateKeyError';
			err.errors = errors;
			callback(err);
		} else {
			callback();
		}

	});

}


function getPaths(source, search) {
	return _(source).keys().map(function(key) {
		if (source[key][search]) {
			return key;
		}

	}).filter(function(item) {
		if (item) {
			return item;
		}
	}).value();
}

module.exports.model.isUnique = function(schema) {

	var paths = getPaths(schema.tree, 'noduplicate');


	schema.pre('save', function(done) {
		if (statusService.initializing) {
			return done();
		}
		var Model = this.constructor;
		isUnique.call(this, Model, paths, done);
	});

};

module.exports.controller.addUniqueCheck = function(resource, Model) {

	var schema = Model.schema;
	var paths = getPaths(schema.tree, 'noduplicate');

	resource.before('put', function(req, res, next) {

		Model.findOne({
			_id: req.params.id
		}).exec(function(err, doc) {

			if (err) {
				next(err);
			} else if (!doc) {
				next();
			} else {

				doc = new Model(req.body);
				if (!req.body._id) {
					req.body._id = req.params.id;
				}

				isUnique.call(doc, Model, paths, function(err) {
					if (err) {
						return res.jsonp(400, err);
					} else {
						next();
					}
				});
			}
		});
	});

};
