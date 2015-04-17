'use strict';

var components = require('../../components');
var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	_ = require('lodash');

var FileSystemItemSchema = new Schema({
	org: {
		require: true,
		ref: 'Org',
		type: mongoose.Schema.Types.ObjectId
	},
	created: {
		type: Date,
		default: Date.now
	},
	modified: {
		type: Date,
		default: Date.now
	},
	name: {
		type: String,
		default: '',
		trim: true,
	},
	directory: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Directory'
	},
	type: {
		type: String,
		default: 'folder',
		trim: true,
		require: true
	}
}, {
	collection: 'filesystemitems',
	discriminatorKey: '_class'
});

FileSystemItemSchema.pre('remove', function(done) {

	var item = this;

	console.log('model::fsitem::pre::remove::enter', item.name, item.directory);


	function removeFromDirectory(removeFromDirectoryDoneCB) {
		var Directory = mongoose.model('FileSystemDirectory');

		Directory.findOneAndUpdate({
			_id: item.directory
		}, {
			$pull: {
				items: item._id
			}
		}).exec(function(err) {
			console.log('model::fsitem::pre::remove::exit', err);
			removeFromDirectoryDoneCB();
		});

	}
	if (item.directory) {
		removeFromDirectory(done);
	} else {
		done();
	}

});

FileSystemItemSchema.pre('save', function(preSaveDoneCB) {

	var FileSystemItem = mongoose.model('FileSystemItem');

	if (components.statusService.initializing) {
		return preSaveDoneCB();
	}

	var item = this;
	var conditions = {
		name: item.name
	};
	if (item.directory) {
		conditions.directory = item.directory;
	}

	FileSystemItem.count(conditions).exec(function(err, count) {

		if (count > 0) {
			// invalidate name
			item.invalidate('name', 'An item with this name already exists', item.name);
		}

		item.validate(function(err) {

			preSaveDoneCB(err);

		});


	});

});

FileSystemItemSchema.pre('save', function(preSaveDoneCB) {

	var item = this;

	if (item.directory) {

		var Directory = mongoose.model('FileSystemDirectory');

		Directory.findOneAndUpdate({
			_id: item.directory
		}, {
			$addToSet: {
				items: item._id
			}
		}).exec(function() {

			preSaveDoneCB();

		});

	} else {
		preSaveDoneCB();
	}

});

FileSystemItemSchema.pre('save', function(preSaveDoneCB) {

	var _self = this;

	if (!_self.org) {

		_self.getParents(function(err, path) {

			var parent = path[0];

			if (parent) {

				_self.org = parent.org;
				// console.log(parent);

				preSaveDoneCB();

			} else {
				preSaveDoneCB();
			}

		});


	} else {
		preSaveDoneCB();

	}

});

FileSystemItemSchema.methods.getParents = function(sendTree) {

	var FileSystemItem = mongoose.model('FileSystemItem');
	
	var doc = this;
	var path = [];
	console.log('model::FileSystemItemSchema::getParents::enter');

	function getParent(parent) {

		if (!parent) {
			console.log('model::FileSystemItemSchema::getParents::getParent::exit', _.pluck(path, 'name'));
			return sendTree(null, path);
		}

		var query = FileSystemItem.findById(parent);

		query.select('name directory org').exec(function(err, directory) {

			console.log('model::FileSystemItemSchema::getParents::getParent::findById::enter');

			if (err) {
				console.log('model::FileSystemItemSchema::getParents::getParent::findById::err', err);
				return sendTree(err, path);
			}

			if (!directory) {
				console.log('model::FileSystemItemSchema::getParents::getParent::findById::exit', _.pluck(path, 'name'));
				return sendTree(null, path);
			}

			path.push(directory);
			console.log('model::FileSystemItemSchema::getParents::getParent::findById::again');
			getParent(directory.directory);

		});

	}
	if (doc.directory) {
		getParent(doc.directory);
	} else {
		sendTree(null, path);
	}

};

FileSystemItemSchema.plugin(components.accessControl, {
	inheritFrom: [{
		model: 'FileSystemDirectory',
		field: 'directory'
	}, {
		model: 'Org',
		field: 'org'
	}]

});


module.exports = mongoose.model('FileSystemItem', FileSystemItemSchema);
