'use strict';

var mongoose = require('mongoose'),
	path = require('path'),
	async = require('async'),
	_ = require('lodash');

var components = require('../../components');
var apiUtils = components.apiUtils;


var getFileModelForType;
exports.getFileModelForType = getFileModelForType = function getFileModelForType(type) {

	var ImageFile = mongoose.model('FileSystemImageFile');
	var File = mongoose.model('FileSystemFile');

	var model = File;

	if (type.match(/^image/)) {
		model = ImageFile;
	}

	return model;
};

var replaceFile;
exports.replaceFile = replaceFile = function replaceFile(req, res) {


	var File = mongoose.model('FileSystemFile');

	var fileId = req.params.id;



	File.findById(fileId).exec(function(err, file) {

		function onFileCopied(err, gridStoreFile) {

			if (err) {
				return res.send(500, err.message || err);

			}

			file.fileId = gridStoreFile.fileId;

			File.findOneAndUpdate({
				_id: file._id
			}, {
				fileId: file.fileId
			}).exec(function(err, file) {
				if (err) {
					return res.send(500, err.message || err);

				}
				res.jsonp(200, file);
			});


		}

		if (err) {
			return res.send(500, err.message || err);
		}

		if (!file) {
			return res.send(404, 'File Not Found');
		}


		var keys = Object.keys(req.files);

		if (keys.length > 0) {
			var key = keys[0];
			var tmpFile = req.files[key];

			if (_.isArray(tmpFile)) {
				tmpFile = tmpFile[0];
			}

			var copyData = {
				path: tmpFile.path,
				name: tmpFile.name,
				type: tmpFile.type,
				size: tmpFile.size
			};

			File.delete(file.fileId, function(err) {

				if (err) {
					var message = err.message || err;
					if (!message.match(/does not exist/)) {
						return res.send(500, message);
					}
				}

				file.copyFile(copyData, onFileCopied);

			});

		} else {
			res.send(500, 'No file present');
		}

	});


};

var uploadFiles;
exports.uploadFiles = uploadFiles = function uploadFiles(req, res) {

	var keys = Object.keys(req.files);
	var savedFiles = [];

	if (keys.length > 0) {

		var directoryId = req.body.directory;

		if (!directoryId) {
			return res.send(500, 'Please specify a directory');
		}

		async.each(keys, function(key, asyncEachKeyDoneCB) {

			var files = req.files[key];

			if (!_.isArray(files)) {
				files = [files];
			}


			function processEachFile(tmpFile, processEachFileDoneCB) {

				var fileData = {
					name: tmpFile.name,
					directory: directoryId,
					type: tmpFile.type
				};

				var FileModel = getFileModelForType(fileData.type);

				var file = new FileModel(fileData);

				file.tmpFile = tmpFile;

				function onFileCopied(err, gridStoreFile) {

					if (err) {
						return processEachFileDoneCB(err);
					}

					file.fileId = gridStoreFile.fileId;

					file.save(function(err) {
						if (err) {
							return processEachFileDoneCB(err);
						}
						savedFiles.push(file);
						processEachFileDoneCB();
					});
				}

				var copyData = {
					path: tmpFile.path,
					name: tmpFile.name,
					type: tmpFile.type,
					size: tmpFile.size
				};
				file.copyFile(copyData, onFileCopied);

			}

			async.each(files, processEachFile, asyncEachKeyDoneCB);


		}, function(err) {
			if (err) {
				return res.send(500, err.message || err);
			}
			res.jsonp(200, savedFiles);
			// Directory.findById(directoryId).populate('files').exec(function(err, directory) {
			// 	if (err) {
			// 		return res.send(500, err.message || err);
			// 	}

			// });
		});

	}

};

var incrementDate = function(date, amount) {
	var tmpDate = new Date(date);
	tmpDate.setDate(tmpDate.getDate() + amount);
	return tmpDate.toGMTString();
};

var downloadFile;
exports.downloadFile = downloadFile = function downloadFile(req, res, noCache) {

	var File = mongoose.model('FileSystemFile');


	var fileId = req.params.id;

	var version = req.query.version || req.query.v;

	File.findById(fileId).exec(function(err, file) {

		if (err) {
			console.log('controller::file::handleFileDownload::findById::error', err);

			return res.send(500, err.message);
		}

		if (!file) {

			err = new Error('File' + fileId + 'not found');
			console.log('controller::file::handleFileDownload::findById::error', err);
			return res.send(400, err.message);

		}

		file.download(function(err, fileStream) {

			if (err) {

				console.log('controller::file::handleFileDownload::findById::download::error', err);

				return res.send(500, err.message);

			}

			console.log('controller::file::handleFileDownload::findById::download::sucess', 'Sending stream');

			var type = fileStream.contentType;
			res.header('Content-Type', type);
			if (false === noCache) {
				res.header('Expires', incrementDate(new Date(), 10)); // Caching
				res.header('Last-Modified', file.modified.toGMTString()); // Caching
			}
			res.header('Content-Disposition', 'filename=' + path.basename(fileStream.filename));

			var stream = fileStream.stream(true);
			if (file.downloadsRemaining !== -1) {

				file.downloadsRemaining--;
				if (file.downloadsRemaining === 0) {
					console.log('controller::file::handleFileDownload::response::end', 'One Time Download');
					stream.on('close', function() {
						console.log('controller::file::handleFileDownload::response::end', 'Removing file');
						file.remove(function() {
							console.log('controller::file::handleFileDownload::response::end', 'File successfully removed', file);
						});
					});
				} else {
					stream.on('close', function() {
						console.log('controller::file::handleFileDownload::response::end', 'Updating remaining downloads');
						file.update({
							$set: {
								downloadsRemaining: file.downloadsRemaining
							}
						}, function() {
							console.log('controller::file::handleFileDownload::response::end', 'File remaining downloads', file.downloadsRemaining);
						});
					});
				}

			}

			stream.pipe(res);



		}, version);

	});

};
exports.attach = function(FileSystemFileResource) {


	var FileSystemFile = require('./filesystem.file.model');

	apiUtils.addPermissionChecks(FileSystemFileResource, FileSystemFile);

	// FileSystemFileResource.before('post', uploadFiles);

	FileSystemFileResource.route('download.get', {
		detail: true,
		handler: downloadFile
	});

	FileSystemFileResource.route('file.post', {
		detail: true,
		handler: replaceFile
	});

	FileSystemFileResource.before('delete', function(req, res) {

		var File = mongoose.model('FileSystemFile');


		var fileId = req.params.id;
		console.log('controller::file::before::delete::enter');


		File.findById(fileId).exec(function(err, file) {

			console.log('controller::file::before::delete::findById::enter');
			if (err) {
				console.log('controller::file::before::delete::findById::err', err);
				return res.send(500, err.message);

			}

			if (!file) {
				err = new Error('File not found');
				console.log('controller::file::before::delete::findById::err', err);
				return res.send(404, err.message);

			}

			var FileModel = getFileModelForType(file.type);

			var realModel = new FileModel(file.toObject());

			realModel.remove(function(err) {
				if (err) {
					console.log('controller::realModel::before::delete::findById::remove::err');
					return res.send(200, err.message);
				}
				console.log('controller::realModel::before::delete::findById::remove::success');
				res.json(200, realModel);
			});
		});

	});

	var getDataUri = function(req, res) { // this function should be moved into a separate file controller

		var File = mongoose.model('FileSystemFile');

		var id = req.params.id;
		var version = req.query.version || req.query.v;

		File.findOne({
			_id: id
		}).exec(function(err, file) {

			if (err) {
				return res.send(400, err.message || err);
			}

			if (!file) {
				return res.send(404, 'File not found');
			}

			file.getBuffer(function(err, fileData, buffer) {

				if (err) {
					return res.jsonp(404, {
						error: err.message || err
					});
				} else {

					var type = fileData.contentType;

					var prefix = 'data:' + type + ';base64,';
					res.header('Content-Type', type);

					var outputFileData = prefix + buffer.toString('base64');
					return res.send(200, outputFileData);
				}


			}, version);

		});


	};

	FileSystemFileResource.route('base64', {
		detail: true,
		handler: getDataUri
	});


};