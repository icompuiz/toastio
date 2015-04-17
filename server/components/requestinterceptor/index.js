'use strict';

var _ = require('lodash'),
    async = require('async');

var DeleteInterceptor = function(resource, Model) {

    resource.before('delete', function(req, res, next) {
        console.log('plugin::deleteInterceptor::before::delete::enter');

        if (req.params.id) {


            Model.findById(req.params.id).exec(function(err, doc) {

                if (err) {
                    console.log('plugin::deleteInterceptor::before::delete::findById::err', err);
                    return res.send(500, err.message || err);
                }

                if (!doc) {
                    err = new Error('Model not found');
                    console.log('plugin::deleteInterceptor::before::delete::findById::err', err);
                    return res.send(404, err.message || err);
                }


                doc.remove(function(err) {
                    if (err) {
                        console.log('plugin::deleteInterceptor::before::delete::findById::remove::err', err);
                        return res.send(500, err.message);
                    }
                    console.log('plugin::deleteInterceptor::before::delete::findById::remove::success');
                    res.json(200, doc);
                });

            });

        } else {
            return next();
        }

    });

};

var PutInterceptor = function(resource, Model) {

    resource.before('put', function(req, res, next) {

        if (req.params.id) {
            var query = Model.findById(req.params.id);

            query.exec(function(err, doc) {


                if (err) {
                    return res.send(500, err.message || err);
                }

                if (!doc) {
                    err = new Error(Model.schema.modelName + ' not found');
                    return res.send(404, err.message || err);
                }

                console.log('plugin::putInterceptor::before::put::validating doc object', doc);

                // doc = _.defaults(req.body, doc);

                _.keys(req.body).forEach(function(key) {
                    doc[key] = req.body[key];
                });

                // console.log('validating object', doc);

                var validateTask = function (afterValidateTask) {
                    doc.validate(afterValidateTask);
                };

                var executePutCallbacksTask = function(afterExecutePutCallbackTask) {
                    if (_.isFunction(doc.onPut)) {
                        doc.onPut(afterExecutePutCallbackTask);
                    } else {
                        afterExecutePutCallbackTask();
                    }
                };

                var tasks = [validateTask, executePutCallbacksTask];

                async.series(tasks, function(err) {
                    if (err) {
                        res.json(500, err);
                    } else {
                        next();
                    }
                });


            });
        } else {
            return next();
        }

    });

};

module.exports = {
    interceptDelete: DeleteInterceptor,
    interceptPut: PutInterceptor
};