'use strict';

var mongoose = require('mongoose'),
    vm = require('vm'),
    async = require('async'),
    jade = require('jade');

var components = require('../../components');

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

ScriptSchema.methods.execute = function(content, callback) {

    var script = this;

    var timeout;
    var callbackInvoked = false;

    function initialize() {
        console.log('Clearing timer for script', script.name);
        stopTimer();
    }

    function sendOutput(err, outputContent) {

        var output = {
            name: script.name,
            raw: script.tag.raw
        };

        if (err) {
            output.content = err.toString();
            output.err = true;
        } else {
            output.content = outputContent;
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
                var asObject = block.toObject();

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
                var asObject = script.toObject();

                asObject.execute = function() {
                    script.execute.apply(script, arguments);
                };

                callback(null, asObject);
            } else {
                callback();
            }
        });

    }

    function findContent(conditions, callback) {
        var Content = mongoose.model('Content');

        function mappingFn(doc, callback) {
        	var asObject = doc.toObject();
        	doc.getPath(function(err, path) {
        		asObject.path = path;
        		callback(err, asObject);
        	});
        }


        Content.find(conditions, function(err, docs) {
            if (err) {
                callback(err);
            } else if (docs.length) {

                if (docs.length === 1) {
                    mappingFn(docs, callback);
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
        '$content': content,
        '$script': script,
        '$options': script.tag.options,
        '$console': console,
        '$Script': findScript,
        '$Content': findContent,
        '$Blocks': compileBlock,
        '$jade': jade
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
