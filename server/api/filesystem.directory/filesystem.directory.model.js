'use strict';

var mongoose = require('mongoose'),
	async = require('async');

var FileSystemItem = require('../filesystem/filesystem.item.model');

var FileSystemDirectorySchema = FileSystemItem.schema.extend({
	items: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'FileSystemItem'
	}],
	path: [],
	type: {
		type: String,
		default: 'folder'
	}
});

// enable virtual
FileSystemDirectorySchema.set('toJSON', {
	virtuals: true
});

FileSystemDirectorySchema.set('toObject', {
	virtuals: true
});

FileSystemDirectorySchema.virtual('count').get(function() {
	
	if (!this.items) {
		return 0;
	}

	var count = this.items.length;
	return count;
});


FileSystemDirectorySchema.pre('remove', function(done) {

	var directory = this;

	var FileSystemFile = mongoose.model('FileSystemFile');

	console.log('model::directory::pre::remove');


	FileSystemFile.find({
		directory: directory._id
	}).exec(function(err, files) {
		async.each(files, function(file, removeNextFile) {

			var Class = mongoose.model(file._class); // need to make sure the correct model's remove is being invoked

			var realFile = new Class(file.toObject());

			realFile.remove(removeNextFile);

		}, done);
	});

});



module.exports =  mongoose.model('FileSystemDirectory', FileSystemDirectorySchema);