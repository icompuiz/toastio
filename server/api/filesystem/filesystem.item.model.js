'use strict';

var components = require('../../components');
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    _ = require('lodash'),
    async = require('async');

var FileSystemItemSchema = new Schema({
    created: {
        type: Date,
        default: Date.now
    },
    modified: {
        type: Date,
        default: Date.now
    },
    alias: String,
    name: {
        type: String,
        default: '',
        trim: true,
        require: true
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

    var fileItemDoc = this;
    var conditions = {
        name: fileItemDoc.name
    };
    if (fileItemDoc.directory) {
        conditions.directory = fileItemDoc.directory;
    }

    FileSystemItem.count(conditions).exec(function(err, count) {

        if (count > 0) {
            // invalidate name
            fileItemDoc.invalidate('name', 'An file with this name already exists', fileItemDoc.name);
        }

        fileItemDoc.validate(function(err) {

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

FileSystemItemSchema.pre('save', function(done) {
	
    var doc = this;

    if (_.isEmpty(doc.alias)) {
        doc.alias = doc.name.toLowerCase().replace(/\W/, '_');
    } else {
        doc.alias = doc.alias.toLowerCase().replace(/\W/, '_');
    }


    done();
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

        query.select('name directory').exec(function(err, directory) {

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

FileSystemItemSchema.methods.getTreeStack = function(returnTreeNodes) {

    var self = this;
    var currentNode = self;
    var FileSystemItem = mongoose.model('FileSystemItem');
    var stack = [];

    console.log('plugin::FileSystemItemModel::getTreeStack::enter');

    function test() {
        console.log('plugin::FileSystemItemModel::getTreeStack::test::', currentNode === null);
        return currentNode === null;
    }

    function work(callback) {

        console.log('plugin::FileSystemItemModel::getTreeStack::work::enter');

        stack.push(currentNode);

        FileSystemItem.findOne({
            _id: currentNode.directory
        }).exec(function(err, parentNode) {

            if (err) {
                callback(err);
            } else {
                currentNode = parentNode;
                callback();
            }

        });

    }

    function done(err) {

        if (err) {
            returnTreeNodes(err);
        } else {
            returnTreeNodes(null, stack);
        }

    }

    async.doUntil(work, test, done);
};

FileSystemItemSchema.plugin(components.accessControl, {
    inheritFrom: {
        model: 'FileSystemDirectory',
        field: 'directory'
    }

});


module.exports = mongoose.model('FileSystemItem', FileSystemItemSchema);
