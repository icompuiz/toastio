'use strict';

var mongoose = require('mongoose'),
	_ = require('lodash'),
	async = require('async');
	
var components = require('../../components');
var apiUtils = components.apiUtils;
exports.attach = function(FilesystemResource) {


	var FileSystemItem = require('./filesystem.item.model');

	apiUtils.addPermissionChecks(FilesystemResource, FileSystemItem);

	FilesystemResource.before('get', function(req, res, next) {

		if (!req.params.id) {
			req.quer.where({
				'directory': null
			});
		}

		req.quer.where({
			_class: 'FileSystemDirectory'
		});
		next();

	});

	FilesystemResource.after('get', function(req, res, next) {

		if (!req.params.id) {

			var root = {
				count: res.locals.bundle.length,
				items: res.locals.bundle
			};

			res.locals.bundle = root;

		}

		if (!_.isArray(res.locals.bundle)) {
			if (res.locals.bundle._class === 'FileSystemDirectory') {
				return res.locals.bundle.setFullPath(next);
			}
		}

		next();

	});

	FilesystemResource.route('search.get', function(req, res) {

		var File = mongoose.model('File');
		var Directory = mongoose.model('Directory');

		var query = req.query;

		var directorySearchConfig = {
			conditions: {}
		};
		var fileSearchConfig = {
			conditions: {}
		};

		var hasFileParams = false;
		var hasDirParams = false;

		if (query.sort) {
			directorySearchConfig.sort = query.sort;
			fileSearchConfig.sort = query.sort;
		}

		if (query.fileSort) {
			fileSearchConfig.sort = query.fileSort;
		}

		if (query.directorySort) {
			directorySearchConfig.sort = query.directorySort;
		}

		if (query.limit) {
			directorySearchConfig.limit = query.limit;
			fileSearchConfig.limit = query.limit;
		}

		if (query.fileLimit) {
			fileSearchConfig.limit = query.fileLimit;
		}

		if (query.directoryLimit) {
			directorySearchConfig.limit = query.directoryLimit;
		}


		if (query.id) {
			hasDirParams = true;
			hasFileParams = true;
			directorySearchConfig.conditions._id = query.id;
			fileSearchConfig.conditions._id = query.id;
		}

		if (query.name) {
			hasDirParams = true;
			hasFileParams = true;
			directorySearchConfig.conditions.name = {
				$regex: '.*' + query.name + '.*',
				$options: 'i'
			};
			fileSearchConfig.conditions.name = {
				$regex: '.*' + query.name + '.*',
				$options: 'i'
			};
		}

		if (query.directoryId) {
			hasDirParams = true;
			directorySearchConfig.conditions._id = query.directoryId;
		}

		if (query.directoryName) {
			hasDirParams = true;
			directorySearchConfig.conditions.name = {
				$regex: '.*' + query.directoryName + '.*',
				$options: 'i'
			};
		}

		if (query.fileName) {
			hasFileParams = true;
			fileSearchConfig.conditions.name = {
				$regex: '.*' + query.fileName + '.*',
				$options: 'i'
			};
		}


		if (query.fileId) {
			hasFileParams = true;
			fileSearchConfig.conditions._id = query.fileId;
		}

		if (query.fileType) {
			hasFileParams = true;
			fileSearchConfig.conditions.type = {
				$regex: '.*' + query.fileType + '.*',
				$options: 'i'
			};
		}

		if (query.fileDirectory) {
			hasFileParams = true;
			fileSearchConfig.conditions.directory = query.fileDirectory;
		}

		if (!(hasFileParams || hasDirParams)) {
			var err = new Error('Please specify some valid query parameters');
			return res.jsonp(500, {
				'error': err.message || err
			});
		}

		function searchFiles(searchFilesDoneCB) {

			if (!hasFileParams) {
				return searchFilesDoneCB();
			}

			var fileQuery = File.find(fileSearchConfig.conditions);

			if (fileSearchConfig.sort) {
				fileQuery.sort(fileSearchConfig.sort);
			}

			if (fileSearchConfig.limit) {
				fileQuery.limit(fileSearchConfig.limit);
			}


			fileQuery.exec(function(err, files) {

				searchFilesDoneCB(err, files);

			});
		}

		function searchDirectories(searchDirectoriesDoneCB) {

			if (!hasDirParams) {
				return searchDirectoriesDoneCB();
			}

			var dirQuery = Directory.find(directorySearchConfig.conditions);

			if (directorySearchConfig.sort) {
				dirQuery.sort(directorySearchConfig.sort);
			}

			if (directorySearchConfig.limit) {
				dirQuery.limit(directorySearchConfig.limit);
			}

			dirQuery.exec(function(err, directories) {

				searchDirectoriesDoneCB(err, directories);

			});
		}

		async.series({
			files: searchFiles,
			directories: searchDirectories
		}, function(err, results) {

			if (err) {
				return res.json(500, err.message || err);
			}

			results = results || {
				files: [],
				directories: []
			};
			var searchData = {
				name: 'Search Results',
				directories: results.directories,
				files: results.files
			};

			res.json(200, searchData);

		});
	});

};
