'use strict';

var mongoose = require('mongoose'),
	fs = require('fs'),
	os = require('os'),
	mime = require('mime'),
	path = require('path'),
	async = require('async'),
	_ = require('lodash'),
	gm = require('gm');
require('mongoose-schema-extend');

var FileSystemFile = require('./filesystem.file.model');

var FileSystemImageFileSchema = FileSystemFile.schema.extend({
	small: {
		type: mongoose.Schema.Types.ObjectId,
	},
	medium: {
		type: mongoose.Schema.Types.ObjectId,
	}
});

// enable virtual
FileSystemImageFileSchema.set('toJSON', {
	virtuals: true
});

FileSystemImageFileSchema.set('toObject', {
	virtuals: true
});


function saveSmall(done) {

	console.log('model::imagefile::saveSmall::enter');

	/* jshint validthis: true */

	var file = this;


	function onFileCopied(err, gridStoreFile) {

		if (err) {
			return done(err);
		}

		file.small = gridStoreFile.fileId;

		done(null, file.small);
	}


	if (file.tmpFile) {

		console.log('model::imagefile::saveSmall::enter', file.tmpFile);


		var tmpFile = file.tmpFile;
		var dirname = path.dirname(tmpFile.path);
		var ext = path.extname(tmpFile.path);
		var basename = path.basename(tmpFile.path, ext);

		basename += '_sm';

		var copyPath = path.join(dirname, basename + ext);

		file.tmpFile.small = copyPath;


		console.log('model::imagefile::saveSmall::copyPath=', copyPath);



		gm(tmpFile.path).autoOrient().resize(100, null).write(copyPath, function(err) {
			if (err) {
				return done(err);
			}
			var copyData = {
				path: copyPath,
				name: basename + ext,
				type: tmpFile.type || mime.lookup(copyPath)
			};
			file.copyFile(copyData, onFileCopied);
		});

	} else {
		done();
	}
}

function saveMedium(done) {

	/* jshint validthis: true */
	var file = this;

	function onFileCopied(err, gridStoreFile) {

		if (err) {
			return done(err);
		}

		file.medium = gridStoreFile.fileId;

		done(null, file.medium);
	}

	if (file.tmpFile) {

		console.log('model::imagefile::saveMedium::enter', file.tmpFile);

		var tmpFile = file.tmpFile;
		var dirname = path.dirname(tmpFile.path);
		var ext = path.extname(tmpFile.path);
		var basename = path.basename(tmpFile.path, ext);

		basename += '_md';

		var copyPath = path.join(dirname, basename + ext);

		file.tmpFile.medium = copyPath;

		console.log('model::imagefile::saveMedium::enter', file.tmpFile);

		console.log(copyPath);

		gm(tmpFile.path).autoOrient().resize(50, 50, '%').write(copyPath, function(err) {
			if (err) {
				return done(err);
			}
			var copyData = {
				path: copyPath,
				name: basename + ext,
				type: tmpFile.type || mime.lookup(copyPath)
			};
			file.copyFile(copyData, onFileCopied);
		});

	} else {
		done();
	}


}

FileSystemImageFileSchema.pre('save', saveMedium);
FileSystemImageFileSchema.pre('save', saveSmall);

FileSystemImageFileSchema.pre('remove', function(done) {

	var file = this;

	var FileSystemImageFile = mongoose.model('FileSystemImageFile');

	function removeGridStore(removeGridStoreDoneCB) {
		console.log('model::ImageFile::pre::remove::small::enter', file._id, file.small);
		return FileSystemImageFile.delete(file.small, removeGridStoreDoneCB);

	}

	if (file.small) {
		removeGridStore(done);
	} else {
		done();
	}

});


FileSystemImageFileSchema.pre('remove', function(done) {

	var FileSystemImageFile = mongoose.model('FileSystemImageFile');


	var file = this;

	function removeGridStore(removeGridStoreDoneCB) {

		console.log('model::ImageFile::pre::remove::medium::enter', file._id, file.medium);
		return FileSystemImageFile.delete(file.medium, removeGridStoreDoneCB);

	}

	if (file.medium) {
		removeGridStore(done);
	} else {
		done();
	}

});

function createVersion(file, version, createVersionTaskDone) {

	var FileSystemImageFile = mongoose.model('FileSystemImageFile');


	console.log('model::imagefile::createVersion::enter', file);

	var filename;

	function saveChanges(err, fileId, skipRemoveTemp, saveChangesCB) {

		if (_.isFunction(skipRemoveTemp)) {
			saveChangesCB = skipRemoveTemp;
			skipRemoveTemp = false;
		}

		skipRemoveTemp = skipRemoveTemp || false;

		if (err) {
			return saveChangesCB(err);
		}

		console.log('model::imagefile::createVersion::saveChanges::enter', version, fileId);


		var updates = {};
		updates[version] = fileId;

		var data = {
			$set: updates
		};


		function doSave(afterDoSave) {
			FileSystemImageFile.findOneAndUpdate({
				_id: file._id
			}, data, function(err, doc) {
				if (err) {
					return afterDoSave(err);
				}
				if (!doc) {
					var imageNotFoundError = new Error('Image File not found');
					return afterDoSave(imageNotFoundError);
				}

				console.log('model::imagefile::createVersion::findOneAndUpdate::enter', doc[version], doc[version].equals(fileId));

				afterDoSave(null, fileId);
			});

		}

		function removeTemp(afterRemoveTemp) {


			function orig(afterOrig) {
				fs.unlink(filename, afterOrig);

			}

			function small(afterSmall) {
				if (!file.tmpFile.small) {
					return afterSmall();
				}
				fs.unlink(file.tmpFile.small, afterSmall);

			}

			function medium(afterMedium) {
				if (!file.tmpFile.medium) {
					return afterMedium();
				}
				fs.unlink(file.tmpFile.medium, afterMedium);

			}

			if (!skipRemoveTemp) {
				async.series([orig, medium, small], afterRemoveTemp);
			} else {
				afterRemoveTemp();
			}


		}

		async.series({
			fileId: doSave,
			removeTemp: removeTemp
		}, function(err, results) {
			if (err) {
				return saveChangesCB(err);
			}

			saveChangesCB(null, results.fileId);
		});

	}

	console.log('model::imagefile::createVersion::enter', version);

	function onStreamReady(err, gridFileStream) {

		console.log('model::imagefile::createVersion::onStreamReady::enter');


		var tmpDir = os.tmpdir().replace(/\\/g, '/');
		filename = path.join(tmpDir, file.name);

		console.log('Creating file at', filename);


		var readStream = gridFileStream.stream(true);

		readStream.on('close', function() {

			console.log('model::imagefile::createVersion::readStream::end::enter');

			file.tmpFile = {
				path: filename,
				name: file.name
			};

			console.log(file.tmpFile.path);

			function saveSmallWaterfallTask(saveSmallWaterfallTaskDone) {
				version = 'small';
				saveSmall.call(file, function(err, smallFileId) {
					saveChanges(err, smallFileId, true, saveSmallWaterfallTaskDone);
				});
			}

			function saveMediumWatefallTask(smallFileId, saveMediumWaterfallTaskDone) {
				version = 'medium';
				saveMedium.call(file, function(err, mediumFileId) {
					saveChanges(err, mediumFileId, saveMediumWaterfallTaskDone);
				});
			}

			switch (version) {
				case 'small':
					saveSmall.call(file, function(err, fileId) {
						saveChanges(err, fileId, createVersionTaskDone);
					});
					break;
				case 'medium':
					saveMedium.call(file, function(err, fileId) {
						saveChanges(err, fileId, createVersionTaskDone);
					});
					break;
				case 'both':
					async.waterfall([saveSmallWaterfallTask, saveMediumWatefallTask], createVersionTaskDone);
					break;
				default:
					fs.unlink(filename, function(err) {
						if (err) {
							return createVersionTaskDone(err);
						}

						var notCandidateError = new Error('FileSystemImageFile has no candidate version ' + version);
						return createVersionTaskDone(notCandidateError);

					});
			}

		});

		readStream.on('error', function(err) {
			if (err) {
				return createVersionTaskDone(err);
			}

		});

		var fileWriteStream = fs.createWriteStream(filename);

		readStream.pipe(fileWriteStream);

	}

	FileSystemImageFile.download(file.fileId, onStreamReady);
}

FileSystemImageFileSchema.methods.handleVersionNotFound = function(version, done) {

	var file = this;
	createVersion(file, version, done);

};

FileSystemImageFileSchema.methods.convert = function(format, done) {
	console.log('model::FileSystemFile::convert::', 'not implemented');
	done();
};

module.exports = mongoose.model('FileSystemImageFile', FileSystemImageFileSchema);
