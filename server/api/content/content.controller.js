'use strict';

var mongoose = require('mongoose'),
    _ = require('lodash'),
    async = require('async'),
    fs = require('fs'),
    deasync = require('deasync'),
    path = require('path');

var components = require('../../components');

var outputFormatsPath = path.join(__dirname, 'output-formats');
var regex = {
    global: /\{{2}=([a-zA-Z0-9_\$-]+)\}{2}([\W\w]+)\{{2}\1=\}{2}/g,
    single: /\{{2}=([a-zA-Z0-9_\$-]+)\}{2}([\W\w]+)\{{2}\1=\}{2}/
};

function extractPropertyTags(template) {

    var parsed = template.match(/\{\{[^(+|=|~)][^}]*[^(=|+|~)]\}\}/g) || [];

    parsed = parsed
        .map(function(tag) {
            return tag.replace(/(^\{\{)|(\}\}$)/g, '');
        })
        .map(function(tag) {

            if (!tag) {
                return null;
            }

            var outputConfig = tag.split(':');

            if (outputConfig.length === 1) {
                outputConfig.push('text');
            } else if (outputConfig.length === 0) {
                return null;
            }

            var property = outputConfig[0];

            var format = outputConfig[1];

            var options = outputConfig.splice(2);

            outputConfig = {
                property: property,
                format: format,
                options: options,
                raw: ['{{', tag, '}}'].join('')
            };

            return outputConfig;
        })
        .filter(function(tag) {
            return tag !== null;
        });


    return parsed;

}

function extractScriptTags(template) {

    var parsed = template.match(/\{{2}~[^\{.]*\}{2}/g) || [];

    parsed = parsed
        .map(function(tag) {
            return tag.replace(/(^\{{2}~)|(\}{2}|$)/g, '');
        })
        .map(function(tag) {
            if (!tag) {
                return null;
            }

            var outputConfig = tag.split(':');

            if (outputConfig.length === 0) {
                return null;
            }

            var options = outputConfig.splice(1);

            var name = tag;
            if (options.length) {
                name = name.replace(':' + options, '');


                options = options.shift().split(',');

                var mapped = options.map(function(part) {
                    var parts1 = part.split('=');
                    var option = {
                        name: parts1[0],
                        value: true
                    };
                    if (parts1[1]) {
                        option.value = parts1[1];
                    }

                    return option;
                });

                options = {};
                _.forEach(mapped, function(item) {
                    options[item.name] = item.value;
                });
            }

            outputConfig = {
                name: name,
                options: options,
                raw: ['{{~', tag, '}}'].join('')
            };

            return outputConfig;
        })
        .filter(function(tag) {
            return tag !== null;
        });




    return parsed;

}

function linkProperties(template, content, callback) {

    var tags = extractPropertyTags(template);

    var Setting = mongoose.model('Setting');

    function getSettings(forwardSettings) {
        var siteSettings = [];

        Setting.find({}).exec(function(err, settings) {
            if (err) {
                return forwardSettings(err);
            }

            _.forEach(settings, function(setting) {
                siteSettings.push({
                    name: '$' + setting.alias,
                    value: setting.value
                });
            });

            return forwardSettings(null, siteSettings);
        });

    }

    function link(siteSettings, doneLinking) {

        content.properties = content.properties.concat([{
            name: '$name',
            value: content.name
        }, {
            name: '$created',
            value: content.created
        }, {
            name: '$modified',
            value: content.modified
        }]).concat(siteSettings);

        var properties = content.properties;

        var tagOutput = _.map(tags, function(tag) {

            var property = _.find(properties, {
                name: tag.property
            });

            if (!property) {
                return null;
            }

            var modulePath = path.join(outputFormatsPath, tag.format + '.js');
            modulePath = path.resolve(modulePath);

            if (fs.existsSync(modulePath)) {
                var outputFormatModule = require(modulePath);

                var output = outputFormatModule.print(property, tag.options);

                tag.output = output;
                return tag;
            } else {

                console.log(modulePath);
            }

        }).filter(function(tag) {
            return tag !== null && tag !== undefined;
        });

        var compiledTemplate = template;

        _.forEach(tagOutput, function(tag) {

            compiledTemplate = compiledTemplate.replace(tag.raw, tag.output);

        });

        return doneLinking(null, compiledTemplate);
    }


    async.waterfall([getSettings, link], function(err, template) {
        callback(null, template);
    });


}


function linkScripts(template, content, callback) {

    var tags = extractScriptTags(template, content);

    var Script = mongoose.model('Script');
    async.map(tags, function(tag, mapNextTag) {

        Script.findOne({
            name: tag.name
        }).exec(function(err, script) {
            if (err) {
                mapNextTag(err);
            } else if (!script) {
                mapNextTag();
            } else {
                script.tag = tag;
                script.execute(content, mapNextTag);
            }
        });

    }, function(err, results) {
        results = results.filter(function(tag) {
            return tag !== null && tag !== undefined;
        });

        _.forEach(results, function(tag) {
            console.log(tag);
            template = template.replace(tag.raw, tag.content || '');

        });

        callback(null, template);
    });

}

function compileTemplate(template) {

    // console.log(template);

    // if () {} // for example if the template is in another format like jade

    try {

        var jade = require('jade');

        var templateFunction = jade.compile(template);

        template = templateFunction({});

        return function(content, callback) {

            linkProperties(template, content, function(err, compiledTemplate) {

                linkScripts(compiledTemplate, content, callback);

            });

        };

    } catch (error) {

        return error;

    }

}

function getTemplate(content, req, res) {
    var Type = mongoose.model('Type');
    var Template = mongoose.model('Template');

    // first get the path to this template
    content.getPath(function(err, path) {
        content.path = path;

        // populte the content's type
        Type.populate(content.type, {
            path: 'template'
        }, function(err, contentType) {

            if (err) {

                return components.errors[400](req, res, err);

            } else if (!contentType) {

                return components.errors[400](req, res, 'A type must be specified for all items');


            } else {

                // populate the tree stack and compose blocks
                var template = new Template(contentType.template);

                template.getTreeStack(function(err, stack) {

                    function processMatch(match) {
                        var parts = match.match(regex.single);
                        // console.log(parts);
                        var block = {
                            placeholder: parts[1],
                            block: (parts[3] || parts[2]).trim(),
                            raw: parts[0]
                        };

                        if (parts[3]) {
                            var options = parts[2];
                            parts = options.split(',').map(function(i) {
                                return i.trim();
                            }).filter(function(i) {
                                return i.trim();
                            });
                            block.options = {};
                            parts.map(function(i) {
                                var keyval = i.split('=');
                                var option = {
                                    key: keyval[0],
                                    value: keyval[1] || true
                                };
                                return option;
                            }).forEach(function(i) {
                                block.options[i.key] = i.value;
                            });
                        }

                        return block;
                    }

                    function findBlocks(stack, accumulator, callback) {

                        var currentNode = stack.shift();

                        if (accumulator) {
                            var keys = _.keys(accumulator);
                            keys.forEach(function(key) {
                                var regex = '{{+' + key + '}}';

                                var compilerOrError = compileTemplate(accumulator[key]);
                                var accumulatorText = '';
                                var sync = true;

                                if (!_.isFunction(compilerOrError)) {
                                    accumulatorText = compilerOrError.message;
                                }

                                compilerOrError(content, function(err, html) {
                                    sync = false;
                                    currentNode.text = currentNode.text.replace(regex, html);
                                });

                                // THIS IS A HACK
                                // blocking wait until template is compiled into html
                                while(sync) {
                                    deasync.runLoopOnce();
                                }
                                
                            });
                        } else {
                            accumulator = {};
                        }

                        if (currentNode.parent) {

                            currentNode.text.match(regex.global)
                                .map(function(match) {

                                    var block = processMatch(match);
                                    return block;
                                }).forEach(function(block) {
                                    accumulator[block.placeholder] = block.block;
                                });

                            findBlocks(stack, accumulator, callback);

                        } else {
                            // console.log(currentNode);
                            callback(null, currentNode.text);
                        }

                    }

                    if (stack && stack.length) {

                        findBlocks(stack, null, function(err, text) {
                            var compilerOrError = compileTemplate(text);

                            if (!_.isFunction(compilerOrError)) {
                                console.error(compilerOrError);
                                return components.errors[400](req, res, JSON.stringify(compilerOrError.message));
                            }

                            compilerOrError(content, function(err, html) {
                                res.send(200, html);
                            });
                        });

                    } else {
                        return components.errors[400](req, res);
                    }


                });

            }




        });
    });
}

function getTemplateById(req, res) {

    var contentId = req.params.contentId;

    var Document = mongoose.model('Document');

    var contentQuery = Document.findById(contentId);

    contentQuery.populate('type');

    contentQuery.exec(function(err, content) {



        if (err || !content) {

            return components.errors[404](req, res);

        }

        getTemplate(content, req, res);

    });

}

function getTemplateByPath(req, res) {

    var contentPath = req.url;


    var Document = mongoose.model('Document');

    Document.findByPath(contentPath, function(err, content) {
        if (err) {
            return components.errors[404](req, res);
        } else {

            req.params.contentId = content;
            getTemplateById(req, res);
        }

    });

}




module.exports = {
    viewById: getTemplateById,
    viewByPath: getTemplateByPath
};
