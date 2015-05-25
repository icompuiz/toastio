'use strict';

var mongoose = require('mongoose'),
	async = require('async'),
	_ = require('lodash');

var DeleteChildrenPlugin = function(schema, options) {
	schema.pre('remove', function(done) {

		var parentField = options.parentField;
		var childModel = options.childModel;

		if (!parentField) {
			var parentFieldErr = new Error('parentField not defined');
			return done(parentFieldErr);
		}

		if (!childModel) {
			var childModelErr = new Error('childModel not defined');
			return done(childModelErr);
		}
		// must delete all campuses 

		console.log('model::', parentField, '>', childModel, '::pre::remove::enter');
		var Model = mongoose.model(childModel);
		var conditions = {};
		conditions[parentField] = this._id;
		Model.find(conditions).exec(function(err, results) {
			console.log('model::', parentField, '>', childModel, '::pre::remove::find::enter');
			if (err) {
				return done(err);
			}

			async.each(results, function(campus, deleteNextModel) {
				console.log('model::', parentField, '>', childModel, '::pre::remove::find::each::enter');
				campus.remove(deleteNextModel);
			}, done);

		});

	});
};


var ParentAttachPlugin = function(schema, options) {

	schema.pre('save', function(doneAttaching) {
		var doc = this;
		var parentField = options.parentField;
		var parentModel = options.parentModel;
		var childCollection = options.childCollection;

		if (!doc[parentField]) return doneAttaching();

		var Parent = mongoose.model(parentModel);
		var push = {};
		push[childCollection] = doc._id;
		Parent.findByIdAndUpdate(doc[parentField], {
			$push: push
		}).exec(function(err) {
			
			if (err) {
				console.log('plugin::ParentAttachPlugin::schema::pre::save::findByIdAndUpdate::err', err);
				return doneAttaching(err);
			}

			console.log('plugin::ParentAttachPlugin::schema::pre::save::findByIdAndUpdate::exit');
			doneAttaching();


		});

	});

	schema.pre('remove', function(doneRemoving) {
		var doc = this;
		var parentField = options.parentField;
		var parentModel = options.parentModel;
		var childCollection = options.childCollection;

		if (!doc[parentField]) return doneRemoving();
		

		var Parent = mongoose.model(parentModel);
		var pull = {};
		pull[childCollection] = doc._id;
		Parent.findByIdAndUpdate(doc[parentField], {
			$pull: pull
		}).exec(function(err) {
			
			if (err) {
				console.log('plugin::ParentAttachPlugin::schema::pre::save::findByIdAndUpdate::err', err);
				return doneRemoving(err);
			}

			console.log('plugin::ParentAttachPlugin::schema::pre::save::findByIdAndUpdate::exit');
			doneRemoving();


		});

	});

};

var NestableModelPlugin = function(schema, modelName, options) {

    options = options || {
        parent: 'parent',
        children: 'children'
    };

    var schemaProps = {};

    schemaProps[options.parent] = {
        ref: modelName,
        type: mongoose.Schema.Types.ObjectId
    };

    schemaProps[options.children] = [{
        ref: modelName,
        type: mongoose.Schema.Types.ObjectId
    }];


    schemaProps.alias = {
        type: String,
        default: '',
        trim: true,
    };

    schema.add(schemaProps);

    schema.methods.getTreeStack = function(returnTreeNodes) {

        var self = this;
        var currentNode = self;
        var Model = mongoose.model(modelName);
        var stack = [];

        console.log('plugin::NestableModelPlugin::getTreeStack::enter');

        function test() {
            console.log('plugin::NestableModelPlugin::getTreeStack::test::', currentNode === null);
            return currentNode === null;
        }

        function work(callback) {

            console.log('plugin::NestableModelPlugin::getTreeStack::work::enter');

            stack.push(currentNode);

            Model.findOne({
                _id: currentNode[options.parent]
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

    schema.methods.removeFromTree = function(parentId, done) {

        var doc = this;

        var Model = mongoose.model(modelName);

        var pull = {};
        pull[options.children] = doc._id;

        Model.findOneAndUpdate({
            _id: parentId
        }, {
            $pull: pull
        }, function(err) {
            if (err) {
                done(err);
            } else {
                done();
            }
        });

    };

    schema.methods.addToTree = function(parentId, done) {

        var doc = this;

        var Model = mongoose.model(modelName);

        function addToParent() {

            var addToSet = {};
            addToSet[options.children] = doc._id;


            Model
                .findOneAndUpdate({
                        _id: parentId
                    }, {
                        $addToSet: addToSet
                    }, {
                        safe: true
                    },
                    function(err, parent) {
                        console.log('plugin::nestableModel::pre::save::findOneAndUpdate::enter');
                        if (err) {
                            console.log('plugin::nestableModel::pre::save::findOneAndUpdate::error', err);
                            return done(err);
                        }

                        if (!parent) {
                            err = new Error('Specified parent not found');
                            console.log('plugin::nestableModel::pre::save::findOneAndUpdate::error', err);
                            return done(err); // TODO: need to do clean up
                        }

                        console.log('plugin::nestableModel::pre::save::findOneAndUpdate::success');
                        done();
                    });

        }

        Model.findById(parentId).exec(function(err, parent) {

            if (err) {
                done(err);
            } else if (!parent) {
                done(new Error('Parent not found'));
            } else {
                parent.getTreeStack(function(err, stack) {

                    if (err) {
                        done(err);
                    } else if (!stack) {
                        // No stack, add away
                        addToParent();
                    } else {

                        var node = _.find(stack, function(item) {
                            return doc._id.equals(item._id);
                        });

                        if (node) {
                            // node already in tree (don't add)
                            done(new Error('Document cannot be a child of a child'));
                        } else {
                            // add away
                            addToParent();
                        }

                    }

                });
            }

        });



    };

    schema.pre('save', function(done) {
        var doc = this;

        if (_.isEmpty(doc.alias)) {
            doc.alias = doc.name.toLowerCase().replace(/\W/, '_');
        } else {
            doc.alias = doc.alias.toLowerCase().replace(/\W/, '_');
        }


        done();
    });

    schema.methods.getPath = function(callback) {

        var doc = this;

        doc.getTreeStack(function(err, stack) {
            if (err) {
                callback(err);
            } else {
                var path = stack.reverse().map(function(item) {
                    return item.alias.replace(/\W/, '_');
                }).join('/');
                path = '/' + path;
                callback(null, path);
            }
        });

    };

    schema.statics.findByPath = function(path, findByPathTaskDone) {

        var Model = this;

        path = path.replace(/^\//, '');
        var aliasStack = path.split('/').reverse();

        var rootConditions = {
            parent: null,
            alias: aliasStack.pop()
        };

        var currentNode = null;

        function getNextNode(conditions, getNextNodeTaskDone) {

            
            if (!conditions.alias) {
                getNextNodeTaskDone(null, currentNode);
            } else {

                Model.findOne(conditions)
                    .exec(function(err, doc) {
                        if (err) {
                            getNextNodeTaskDone(err);
                        } else if (doc) {
                            currentNode = doc;
                            var nextConditions = {
                                parent: doc._id,
                                alias: aliasStack.pop()
                            };
                            getNextNode(nextConditions, getNextNodeTaskDone);
                        } else {
                            getNextNodeTaskDone(new Error('Not found'));
                        }
                    });
            }
        }

        getNextNode(rootConditions, function(err, finalNode) {
            if (err) {
                findByPathTaskDone(err);
            } else {
                
                findByPathTaskDone(null, finalNode);
            }
        });



    };


    schema.pre('save', function(done) {
        var doc = this;

        if (!doc[options.parent]) {
            return done();
        }

        doc.addToTree(doc[options.parent], done);


    });
    schema.pre('remove', function(preRemoveDone) {
        var doc = this;

        console.log('plugin::nestableModel::pre::remove::enter');
        var Model = mongoose.model(modelName);

        var conditions = {
            parent: doc._id
        };

        Model.find(conditions).exec(function(err, chidren) {
            async.each(chidren, function(child, removeNextItem) {

                child.remove(removeNextItem);

            }, preRemoveDone);
        });
    });
    schema.post('remove', function(doc) {

        if (!doc[options.parent]) {
            return;
        }

        var Model = mongoose.model(modelName);
        var pull = {};
        pull[options.children] = doc._id;

        Model
            .findOneAndUpdate({
                    _id: doc[options.parent]
                }, {
                    $pull: pull
                }, {
                    safe: true
                },
                function(err, parent) {

                    console.log('plugin::nestableModel::post::remove::findOneAndUpdate::enter');
                    if (err) {
                        console.log('plugin::nestableModel::post::remove::findOneAndUpdate::error', err);
                        // return done(err);
                        return;
                    }

                    if (!parent) {
                        err = new Error('Specified parent not found');
                        console.log('plugin::nestableModel::post::remove::findOneAndUpdate::error', err);
                        // return done(err); // TODO: need to do clean up
                        return;
                    }

                    console.log('plugin::nestableModel::post::remove::findOneAndUpdate::success');
                    // done();
                });
    });


};

var nestableControllerPlugin = function(resource, model, options) {

    if (_.isString(model)) {
        model = mongoose.model(model);
    }

    options = options || {
        parent: 'parent',
        children: 'children'
    };

    resource.route('path.get', {
        handler: function(req, res, next) {

            var path = req.params.path;

            model.findByPath(path, function(error, node) {

                if (error) {
                    return req.jsonp(400, error);
                }

                return req.jsonp(200, node);

            })

        }
    });

    resource.route('tree.get', {
        detail: true,
        handler: function(req, res) {

            var id = req.params.id;

            model.findById(id).exec(function(err, doc) {

                if (err) {
                    res.send(400, err);
                } else if (doc) {

                    doc.getTreeStack(function(err, treeStack) {

                        if (err) {
                            res.send(400, err);
                        } else {

                            res.jsonp(treeStack);

                        }

                    });

                } else {
                    res.send(404, 'Not found');
                }

            });

        }
    });

    resource.before('get', function(req, res, next) {

        if (!req.params.id  && !req.query.pass) {

            var conditions = {
                $or: []
            };

            var opt = {};
            opt[options.parent] = {
                $exists: false
            };

            conditions.$or.push(opt);

            opt[options.parent] = null;


            req.quer.where(conditions);
        }

        next();

    });

    resource.before('put', function(req, res, next) {

        if (_.isEmpty(req.body.alias)) {
            req.body.alias = req.body.name.toLowerCase().replace(/\W/, '_');
        } else {
            req.body.alias = req.body.alias.toLowerCase().replace(/\W/, '_');
        }


        next();

    });

    // Access Control: remove 
    resource.before('put', function(req, res, next) {


        console.log('plugin::nestableControllerPlugin::before::put::enter');

        model.findById(req.params.id).exec(function(err, doc) {

            if (err) {
                console.log('plugin::nestableControllerPlugin::before::put::findById::err', err);
                return res.send(500, err.message || err);
            }

            if (!doc) {
                err = new Error('Model not found');
                console.log('plugin::nestableControllerPlugin::before::put::findById::err', err);
                return res.send(404, err.message || err);
            }

            var parentId = req.body[options.parent];

            function addToTree() {
                doc.addToTree(parentId, function(err) {
                    if (err) {
                        res.send(400, err.message || err);
                    } else {
                        next();
                    }
                });
            }

            if (parentId) { // case 1

                if (!doc[options.parent]) {
                    // continue
                    addToTree();
                } else if (doc._id.equals(parentId)) {
                    // remove the property from the body
                    res.send(400, 'Cannot be a child of itself');
                } else if (!doc[options.parent].equals(parentId)) {
                    doc.addToTree(parentId, function(err) {
                        if (err) {
                            res.send(400, err.message || err);
                        } else {
                            doc.removeFromTree(doc[options.parent], function(err) {
                                if (err) {
                                    res.send(400, err.message || err);
                                } else {
                                    next();
                                }
                            });
                        }
                    });
                } else {
                    next();
                }

            } else { // case 2

                req.body[options.parent] = null;

                if (!doc[options.parent]) {
                    next();
                } else {
                    doc.removeFromTree(doc[options.parent], function(err) {
                        if (err) {
                            res.send(400, err.message || err);
                        } else {
                            next();
                        }
                    });
                }

            }

        });
    });


};

exports.parentAttach = ParentAttachPlugin;
exports.deleteChildren = DeleteChildrenPlugin;
exports.nestableModel = NestableModelPlugin;
exports.nestableController = nestableControllerPlugin;
