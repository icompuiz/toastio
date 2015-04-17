'use strict';

var mongoose = require('mongoose'),
	_ = require('lodash'),
	async = require('async');

var components = require('../../components');
var apiUtils = components.apiUtils;

var FileSystemFileController = require('../filesystem.file/filesystem.file.controller');

exports.attach = function(FileSystemDirectoryResource) {


	var FileSystemDirectory = require('./filesystem.directory.model');

	apiUtils.addPermissionChecks(FileSystemDirectoryResource, FileSystemDirectory);

	FileSystemDirectoryResource.route('files.post', {
		detail: true,
		handler: function(req, res, next) {

			var Directory = mongoose.model('FileSystemDirectory');

			var directoryId = req.params.id;

			// find the directory by id
			Directory.findById(directoryId).exec(function(err, directory) {

				if (!req.body) {
					req.body = {};
				}

				if (err) {
					return res.send(500, err.message);
				}

				if (!directory) {
					return res.send(404, 'Directory not found');
				}

				req.body.directory = directory._id;

				FileSystemFileController.uploadFiles(req, res, next);

			});

		}
	});


	FileSystemDirectoryResource.before('delete', function(req, res) {

		var Directory = mongoose.model('FileSystemDirectory');

		var directoryId = req.params.id;
		console.log('controller::file::before::delete::enter');

		Directory.findById(directoryId).exec(function(err, directory) {

			console.log('controller::directory::before::delete::findById::enter');
			if (err) {
				console.log('controller::directory::before::delete::findById::err', err);
				return res.send(500, err.message);

			}

			if (!directory) {
				err = new Error('Directory not found');
				console.log('controller::directory::before::delete::findById::err', err);
				return res.send(404, err.message);

			}

			directory.remove(function(err) {
				if (err) {
					console.log('controller::directory::before::delete::findById::remove::err');
					return res.send(200, err.message);
				}
				console.log('controller::directory::before::delete::findById::remove::success');
				res.json(200, directory);
			});
		});

	});

	FileSystemDirectoryResource.after('get', function(req, res, next) {

		if (res.locals.bundle._class === 'FileSystemDirectory') {
			return res.locals.bundle.getParents(function(err, parents) {

				if (err) {
					return next(err);
				}

				res.locals.bundle.path = parents.reverse();
				// res.jsonp(200, res.locals.bundle);
				next();
			});


		} else {
			next();
		}


	});

	FileSystemDirectoryResource.after('get', function(req, res, next) {

		var FileSystemItem = mongoose.model('FileSystemItem');


		if (res.locals.bundle._class === 'FileSystemDirectory') {

			var items = res.locals.bundle.items;
			var itemIds = _.pluck(items, '_id').filter(function(itemId) {
				return itemId;
			});

			if (items.length && !itemIds.length) {

				res.locals.bundle.items = null;

				return next();
			}

			FileSystemItem.find({
				_id: {
					$in: itemIds
				}
			}).exec(function(err, fileDocs) {

				if (err) {
					return next(err);
				}

				async.filter(fileDocs, function(fileDoc, iterateFileDocs) {

					fileDoc.isAllowed('read', function(err, isAllowed) {

						if (err) {
							return iterateFileDocs(false);
						}

						iterateFileDocs(isAllowed);

					});


				}, function(allowedFiles) {

					res.locals.bundle.items = allowedFiles;

					res.setHeader('Last-Modified', (new Date()).toUTCString());

					next();

				});

			});

			return;

		}

		next();

	});

};
