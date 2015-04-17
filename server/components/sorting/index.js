'use strict';

/**
 * Module dependencies.
 */
var async = require('async');

function SortableComponent(schema, options) {

	schema.add({
		index: {
			type: Number,
			default: -1
		}
	});

	function getModel() {
		/* jshint validthis: true */
		var model = this.model(this.constructor.modelName);
		return model;
	}

	schema.statics.resort = function(parentId, done) {

		var SortableModel = this;

		// DEBUG: console.log('SortableComponent::resort::', this.modelName, '::', options.parent, '::', parentId);

		function sortDocuments(err, documents) {
			// DEBUG: console.log('SortableComponent::resort::sortDocuments::enter');
			if (err) {
				return done(err);
			}

			var counter = 0;
			var updatedDocuments = [];
			async.eachSeries(documents, function(current, sortNext) {

				SortableModel.findOneAndUpdate({
					_id: current._id
				}, {
					$set: {
						index: counter++
					}
				}, function(err, doc) {


					if (err) {
						// DEBUG: console.log('SortableComponent::resort::sortDocuments::error', err);
						return sortNext(err);
					}

					if (!doc) {
						// DEBUG: console.log('SortableComponent::resort::sortDocuments::error::document not found', current._id);
						return sortNext();
					}

					// counter++;

					updatedDocuments.push(doc);

					sortNext();

				});

			}, function() {

				done(null, updatedDocuments);

			});


		}

		var queryOptions = {};

		queryOptions[options.parent] = parentId;

		var sortQuery = SortableModel.find(queryOptions);

		if (options.sortBy) {
			sortQuery.sort(options.sortBy || '');
		}

		return sortQuery.exec(sortDocuments);

	};

	// Will set a sort value for all model of this type
	schema.pre('save', function(done) {

		if (!options.parent) {
			return done();
		}

		var doc = this;

		// DEBUG: console.log(doc);

		if (doc._id) {
			return done();
		}

		var model = getModel.call(doc);

		var queryOptions = {};

		// DEBUG: console.log('SortableComponent::pre::save::', model.modelName);

		queryOptions[options.parent] = doc[options.parent];

		// DEBUG: console.log('SortableComponent::pre::save::parent=', options.parent, ',', queryOptions[options.parent]);

		model.count(queryOptions).exec(function(err, count) {
			if (err) {
				return done(err);
			}
			doc.index = count;
			done();
		});

	});

}

function ResortableComponent(resource, model, parentModel) {

	resource.route('resort.post', {
		handler: function(req, res) {

			function resetSortIndexes(id, resetSortIndexesDoneCB) {

				model.resort(id, function(err) {

					if (err) {
						resetSortIndexesDoneCB(err);
						// return res.json(500, err.message);
					}

					resetSortIndexesDoneCB();

				});

			}

			console.log(req.query.id);
			// if (!req.query.id) {
			// 	return res.send(500, 'Specify a ' + parentModel.modelName + ' id');
			// }

			var conditions = {};

			if (req.query.id) {
				conditions._id = req.query.id;
			}

			parentModel.find(conditions).exec(function(err, parentModels) {

				if (err) {
					return res.send(500, 'Unexpected error while resetting model sort indexes. Check that the ' + parentModel.modelName + ' id is valid');
				}

				if (!parentModels) {

					return res.send(404, 'Specified ' + parentModel.modelName + ' not found');
				}

				async.each(parentModels, function(item, sortNextItem) {

					resetSortIndexes(item._id, sortNextItem);

				}, function(err) {
					if (err) {
						return res.send(400, err.message || err);
					}
					res.send(200, 'All ' + model.modelName + 's resorted successfully');
					
				});
			});


		}
	});

}


exports.sortable = SortableComponent;
exports.resortable = ResortableComponent;