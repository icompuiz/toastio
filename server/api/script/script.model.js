'use strict';

var mongoose = require('mongoose'),
    vm = require('vm'),
    async = require('async'),
    lodash = require('lodash'),
    http = require('http'),
    https = require('https'),
    jade = require('jade'),
    moment = require('moment'),
    _ = lodash;

var components = require('../../components');

var utils = {
    _: lodash,
    lodash: lodash,
    async: async,
    jade: jade,
    moment: moment
};

require('mongoose-schema-extend');

var ScriptSchema = components.model.schema.extend({
    name: {
        type: String,
        default: '',
        trim: true,
        required: true
    },
    text: {
        type: String,
        default: ''
    }
});

ScriptSchema.methods.execute = function(document, httpRequest, httpResponse, callback) {

    var request = _.toPlainObject(httpRequest);
    var response = _.toPlainObject(httpResponse);

    var script = this;

    var timeout;
    var callbackInvoked = false;

    function initialize() {
        console.log('Clearing timer for script', script.name);
        stopTimer();
    }

    function sendOutput(err, outputDocument, options) {

        var output = {
            name: script.name,
            raw: script.tag.raw
        };

        if (err) {
            output.html = err.toString();
            output.err = true;
        } else {
            output.html = outputDocument;
        }

        if (!callbackInvoked) {
            callbackInvoked = true;
            callback(null, output);
        }

    }

    function compileBlock(name, callback) {
        var Block = mongoose.model('Block');
        Block.findOne({
            name: name
        }).exec(function(err, block) {
            if (err) {
                callback(err);
            } else if (block) {

                var asObject = lodash.toPlainObject(block);

                asObject.compile = function(data) {
                    return block.compile(data);
                };

                callback(null, asObject);
            } else {
                callback();
            }
        });
    }

    function findScript(name, callback) {
        var Script = mongoose.model('Script');
        Script.findOne({
            name: name
        }).exec(function(err, script) {
            if (err) {
                callback(err);
            } else if (script) {

                var asObject = lodash.toPlainObject(script);
                asObject.execute = function() {
                    script.execute.apply(script, arguments);
                };

                callback(null, asObject);
            } else {
                callback();
            }
        });

    }

    function createDocument(newDocument) {

        var options = {};
        var callback = function() {};
        if (lodash.isFunction(arguments[1])) {
            callback = arguments[1];
        } else if (lodash.isObject(arguments[1])) {
            options = arguments[1];
            callback = arguments[2];
        }

        var Document = mongoose.model('Document');

        Document.create(newDocument, callback);

    }

    function findDocument(conditions, arg1, arg2) {

        var options = {};
        var callback = function() {};
        if (lodash.isFunction(arg1)) {
            callback = arg1;
        } else if (lodash.isObject(arg1)) {
            options = arg1;
            callback = arg2;
        }

        var Document = mongoose.model('Document');

        function mappingFn(doc, callback) {
            var asObject = lodash.toPlainObject(doc);

            doc.getPath(function(err, path) {
                asObject.path = path;
                callback(err, asObject);
            });
        }


        var query = Document.find(conditions);

        if (options.populate) {
            if (!lodash.isArray(options.populate)) {
                options.populate = [options.populate];
            }
        }

        lodash.forEach(options.populate, function(populateConfig) {
            query.populate(populateConfig);
        });

        query.exec(function(err, docs) {
            if (err) {
                callback(err);
            } else if (docs.length) {

                if (docs.length === 1) {
                    mappingFn(docs[0], callback);
                } else {
                    async.map(docs, mappingFn, callback);
                }

            } else {
                callback();
            }
        });
    }

    function stopTimer() {
        console.log('Clearing execution timer');
        clearTimeout(timeout);
    }

    function startTimer() {
        console.log('Starting execution timer');
        timeout = setTimeout(function() {
            console.log('Script execution timeout exeeded');
            sendOutput(null, 'Script execution timeout exeeded, make sure your script calls the start function');
        }, 20 * 1000);
    }

    var sandbox = {
        '$start': initialize,
        '$end': sendOutput,
        '$document': document.toObject(),
        '$script': script,
        '$options': script.tag.options,
        '$console': console,
        '$Script': findScript,
        '$Find': findDocument,
        '$Create': createDocument,
        '$Blocks': compileBlock,
        '$utils': utils,
        '$request': request,
        '$response': response,
        '$http': http,
        '$https': https
    };


    try {
        var compiledScript = vm.createScript(script.text);
        startTimer();
        compiledScript.runInNewContext(sandbox);
    } catch (error) {
        console.log(error);
        stopTimer();
        sendOutput(error);
    }

};

module.exports = mongoose.model('Script', ScriptSchema);
