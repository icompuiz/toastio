'use strict';

require('colors');
require('stripcolorcodes');

var async = require('async');
var _ = require('lodash');
var mongoose = require('mongoose');


function treeRelationshipPlugin(schema) {

	//  Adds Support for:
	//
	//  SAMPLE Schema Entry:
	// 	floor: { type: mongoose.Schema.Types.ObjectId, ref: 'Floor', parentRefTree: 'client-tree', parentRefTreeGuiSubMenuPrefix: 'damper/' },
	//                                                               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
	// When you use this you call it with a object like:
	// Method Invocation on This: .findPathFromRoot({ treeCode: 'client-tree' },function(err,doc) { ... });
	// Static Invocation on Model: .findPathFromRoot({ treeCode: 'client-tree', id: <id> },function(err,doc) { ... });

	schema.statics.findPathFromRoot = function(context, cb) {
		if (typeof context === 'object') {
			if (context.dbIdPath === undefined) {
				context.dbIdPath = [];
			}
			if (context.dbModelPath === undefined) {
				context.dbModelPath = [];
			}
			if (context.guiIdPath === undefined) {
				context.guiIdPath = [];
			}
			if (context.guiTreeApiPath === undefined) {
				context.guiTreeApiPath = [];
			}
			if (context.guiNamePath === undefined) {
				context.guiNamePath = [];
			}
			var path = _.findKey(schema.tree, {
				parentRefTree: context.treeCode
			});
			if (path) {
				var pathObj = schema.tree[path];
				if (pathObj && pathObj.ref) {
					var Parent = mongoose.model(pathObj.ref);
					console.log('Searching for'.yellow.bold, context.id, 'using model'.yellow.bold, pathObj.ref);
					Parent.findById(context.id).exec(function(err, doc) {
						if (err) {
							return cb(true, 'findPathFromRoot failed to find the parent referenced by id: ' + context.id + ' on model: ' + pathObj.ref);
						}

						if (!doc) {
							return cb(true, 'findPathFromRoot failed to find the parent referenced by id: ' + context.id + ' on model: ' + pathObj.ref);
						}
						if (typeof pathObj.parentRefTreeGuiSubMenuPrefix === 'string') {
							context.guiIdPath.push(pathObj.parentRefTreeGuiSubMenuPrefix + '/' + doc.id);
							context.guiTreeApiPath.push(pathObj.ref + '/' + pathObj.parentRefTreeGuiSubMenuPrefix);
							context.guiNamePath.push(pathObj.parentRefTreeGuiSubMenuPrefix);
						}
						context.dbIdPath.push(doc.id);
						context.dbModelPath.push(pathObj.ref);
						context.guiIdPath.push(doc.id);
						context.guiTreeApiPath.push(pathObj.ref);
						context.guiNamePath.push(doc.name || doc.id);
						delete(context.id);
						doc.findPathFromRoot(context, cb);
					});
				} else {
					cb(true, 'findPathFromRoot found a tagged parentRefTree path, but there is no "Ref" object, so it can not be part of a reference tree');
				}
			} else {
				// Success, reached top of tree as determined by no more schema objects tagged with the treeCode.
				context.dbIdPath = context.dbIdPath.reverse();
				context.dbModelPath = context.dbModelPath.reverse();
				context.guiIdPath = context.guiIdPath.reverse();
				context.guiTreeApiPath = context.guiTreeApiPath.reverse();
				context.guiNamePath = context.guiNamePath.reverse();
				delete(context.id);
				cb(false, context);
			}
		} else {
			cb(true, 'findPathFromRoot (static invocation) did not receive a "context" parameter object');
		}
	};


	schema.methods.findPathFromRoot = function(context, cb) {
		// expects context: { treeCode: 'treeCodeName' , idPath: [], modelPath: [] } --  idPath and modelPath can and should be left out when called from outside this plugin (and is mostly used by the function when called recursively.)
		if (typeof context === 'object') {
			var path = _.findKey(schema.tree, {
				parentRefTree: context.treeCode
			});
			context.id = this[path];
			schema.statics.findPathFromRoot(context, cb);
		} else {
			cb(true, 'findPathFromRoot (this invocation) did not receive a "context" parameter object');
		}
	};

}

var addTreePathRoute = function(resource, model) {
	resource.route('treepath', 'get', {
		detail: true,
		handler: function(req, res) {
			console.log(req.params.id);
			model.findById(req.params.id, function(err, doc) {
				if (err) {
					res.send(500, doc);
				} else {
					try {
						doc.findPathFromRoot({
							treeCode: req.query.treecode
						}, function(err, path) {
							if (err) {
								res.send(500, doc);
							} else {
								res.send(path);
							}
						});
					} catch (err) {
						res.send(500, 'treepath query not supported by object returned with provided id.  [' + err + ']');
					}
				}
			});
		}
	});
};

var addPermissionChecks = function(resource, model) {
	function checkDocument(doc, action, callback) {
		function doCheck() {
			doc.isAllowed(action, function(err, isAllowed) {
				callback(null, isAllowed, doc, action);
			});
		}

		if (!doc) {
			var error = new Error('Error checking permissions on document: Document not found');
			error.errorCode = 404;
			return callback(error);
		}

		if (doc.acl && _.isFunction(doc.isAllowed)) {
			return doCheck();
		} else if (doc._id) {
			return checkDocumentById(doc, action, callback)
		} else {
			var error = new Error('Error checking permissions on document');
			error.errorCode = 400;
			return callback(error);
		}


		// if (doc) {
		// 	if (false && _.isFunction(doc.isAllowed) && (!doc.acl)) {
		// 		console.log('Resetting ACL for model', doc._id, doc.name || doc.username);
		// 		doc.resetACL(function(err) {
		// 			if (err) {
		// 				callback(500, 'Unexpected error:' + (err.message || err));
		// 			}
		// 			doc.constructor.findByIdAndUpdate(doc._id, {
		// 				$set: {
		// 					acl: doc.acl
		// 				}
		// 			}, function(err) {
		// 				if (err) {
		// 					callback(500, 'Unexpected error:' + (err.message || err));
		// 				}
		// 				doCheck();
		// 			});
		// 		});
		// 	} else {
		// 		doCheck();
		// 	}
		// } else {
		// 	callback(404, 'Resource not found');
		// }
	}

	function checkDocumentById(item, action, callback) {
		model.findById(item._id).exec(function(err, doc) {
			if (err) {
				callback(500, 'Unexpected error:' + (err.message || err));
			}
			checkDocument(doc, action, callback);
		});
	}

	resource
		.after('get', function(req, res, next) {

			// filter out each model 


			function indexTask(indexTaskCB) {
				var sortIndex = _.indexBy(res.locals.bundle, '_id');
				return indexTaskCB(null, sortIndex);
			}

			function bundleTask(bundleTaskCB) {
				var bundle = {};
				// order is important so use the slower eachSeries
				async.each(res.locals.bundle, function(item, iterate) {

					checkDocument(item, 'read', function(err, allowed, doc) {
						if (err) {
							return res.send(err, allowed);
						}

						if (allowed) {
							if (req.query.select) {
								var select = req.query.select.split(/\s|\+/);
								doc = _.pick(doc.toObject(), select);
							}

							bundle[doc._id] = doc;
						}
						iterate();

					});

				}, function(err) {

					res.locals.bundle = [];

					res.locals.bundle = bundle;

					bundleTaskCB(err, bundle);
				});
			}
			if (!res.locals.bundle._id) {

				async.parallel({
					index: indexTask,
					bundle: bundleTask
				}, function(err, results) {

					var resortedBundle = [];

					_.forEach(results.index, function(item, key) {
						var doc = results.bundle[key];
						if (doc) {
							resortedBundle.push(doc);
						}
					});

					res.locals.bundle = resortedBundle;

					return next();

				});

			} else {
				next();
			}


		})
		.before('get', function(req, res, next) {
			if (req.params.id) {
				checkDocumentById({
					_id: req.params.id
				}, 'read', function(err, allowed, doc, action) {
					if (err) {
						return res.send(err, allowed);
					}
					if (allowed) {
						next();
					} else {
						console.log('Action', action, 'denied for user', req.user.username, 'on', model.modelName, 'resource', doc._id, ', Send 403');
						return res.send(403);
					}
				});
			} else {
				next();
			}
		})
		.before('put', function(req, res, next) {
			checkDocumentById(req.body, 'modify', function(err, allowed, doc, action) {
				if (err) {
					return res.send(err, allowed);
				}
				if (allowed) {
					next();
				} else {
					console.log('Action', action, 'denied for user', req.user.username, 'on', model.modelName, 'resource', doc._id, ', Send 403');
					return res.send(403);
				}
			});

		})
		.before('delete', function(req, res, next) {
			checkDocumentById({
				_id: req.params.id
			}, 'remove', function(err, allowed, doc, action) {
				if (err) {
					return res.send(err, allowed);
				}
				if (allowed) {
					next();
				} else {
					console.log('Action', action, 'denied for user', req.user.username, 'on', model.modelName, 'resource', doc._id, ', Send 403');
					return res.send(403);
				}
			});
		});
};


module.exports = {
	treeRelationship: treeRelationshipPlugin,
	addTreePathRoute: addTreePathRoute,
	addPermissionChecks: addPermissionChecks
};
