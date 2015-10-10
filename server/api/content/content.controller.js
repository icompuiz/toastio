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

function pluckDocumentPropertyTags(template) {

    var documentPropertyTags = template.match(/\{\{[^(+|=|~)][^}]*[^(=|+|~)]\}\}/g) || [];

    documentPropertyTags = _(documentPropertyTags)
        .map(function(tag) {
            return tag.replace(/(^\{\{)|(\}\}$)/g, '');
        })
        .map(function(tag) {

            if (!tag) {
                return null;
            }

            var tagConfig = tag.split(':');

            if (tagConfig.length === 1) {
                tagConfig.push('text');
            } else if (tagConfig.length === 0) {
                return null;
            }

            var property = tagConfig[0];

            var format = tagConfig[1];

            var options = tagConfig.splice(2);

            tagConfig = {
                property: property,
                format: format,
                options: options,
                raw: ['{{', tag, '}}'].join('')
            };

            return tagConfig;
        })
        .compact()
        .value();


    return documentPropertyTags;

}

/**
 * getScriptTags
 * @param - template<string> The raw HTML content to be parsed
 * @returns - a list of script tags included in the template
 */
function getScriptTags(template) {

    var scriptTags = template.match(/\{{2}~[^\{.]*\}{2}/g) || [];

    scriptTags = _(scriptTags)
        .map(function(tag) {
            return tag.replace(/(^\{{2}~)|(\}{2}|$)/g, '');
        })
        .map(function(tag) {
            if (!tag) {
                return null;
            }

            var tagConfig = tag.split(':');

            if (tagConfig.length === 0) {
                return null;
            }

            var options = tagConfig.splice(1);

            var name = tag;
            if (options.length) {
                name = name.replace(':' + options, '');

                options = options.shift().split(',');

                var mapped = options.map(function(option) {
                    var factors = option.split('=');
                    var option = {
                        name: factors[0],
                        value: true
                    };
                    if (factors[1]) {
                        option.value = factors[1];
                    }

                    return option;
                });

                options = {};
                _.forEach(mapped, function(item) {
                    options[item.name] = item.value;
                });
            }

            tagConfig = {
                name: name,
                options: options,
                raw: ['{{~', tag, '}}'].join('')
            };

            return tagConfig;
        })
        .compact()
        .value();


    return scriptTags;
}

/**
 * injectDocumentProperties
 * @param template<string> - An HTML string with 0..* property tags
 * @param document<Document> - A document object from which property tag values will be
 * pulled from 
 * @async Passes the HTML template with property tags replaced by the property value
 * for the current document
 */

function injectDocumentProperties(template, document, injectDocumentPropertiesCb) {

    var tags = pluckDocumentPropertyTags(template);

    var Setting = mongoose.model('Setting');

    function getSettings(getSettingsCb) {
        var siteSettings = [];

        Setting.find({}).exec(function(err, settings) {
            if (err) {
                return getSettingsCb(err);
            }

            _.forEach(settings, function(setting) {
                siteSettings.push({
                    name: '$' + setting.alias,
                    value: setting.value
                });
            });

            return getSettingsCb(null, siteSettings);
        });

    }

    function link(siteSettings, doneLinking) {

        document.properties = document.properties.concat([{
            name: '$name',
            value: document.name
        }, {
            name: '$created',
            value: document.created
        }, {
            name: '$modified',
            value: document.modified
        }]).concat(siteSettings);

        var properties = document.properties;

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
        injectDocumentPropertiesCb(null, template);
    });


}

/**
 * injectScripts
 * @param template<string> - An HTML string with 0..* script tags
 * @param document<Document> - A document object to pass into the script's
 * execution context
 * @async Passes the HTML template with script tags replaced 
 * by the result of executing that script
 */

function injectScripts(template, document, httpRequest, httpResponse, injectScriptsCb) {

/**
 * getScriptTags
 * @param - template: The raw HTML content to be parsed
 * @returns - a list of script tags included in the template
 */
    var tags = getScriptTags(template, document);

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
                script.execute(document, httpRequest, httpResponse, mapNextTag);
            }
        });

    }, function(err, results) {
        results = results.filter(function(tag) {
            return tag !== null && tag !== undefined;
        });

        _.forEach(results, function(tag) {
            template = template.replace(tag.raw, tag.html || '');

        });

        injectScriptsCb(null, template);
    });

}

/**
 * compileTemplate
 * @param template<string> - the raw template content
 * @return a projection function that will link properties and scripts 
 * Will compile a valid jade file into HTML and return a projection function 
 * with that compiled template available in the closure
 */

function compileTemplate(template, isJadeTemplate) {

    try {

        if (isJadeTemplate) {
            var jade = require('jade');

            var templateFunction = jade.compile(template);

            template = templateFunction({}); // <- provide some locals for this projection
        }


        return function(content, httpRequest, httpResponse, callback) {

            injectDocumentProperties(template, content, function(err, compiledTemplate) {

                injectScripts(compiledTemplate, content, httpRequest, httpResponse, callback);

            });

        };

    } catch (error) {

        return error;

    }

}

/**
 * getTemplate
 * @param content<DocumentModel> - the fully formed Document resource
 * @param req<object> - the express request handle
 * @param res<object> - the express response handle
 * @async - Will invoke res.send to resolve the request or res.error to
 * identify and error has occured.
 * Will compile a Document's template if the document is associated with a type
 * If not associated with a type, respond with an error.
 * If Document's type does not have a template, respond with a blank html document
 */

function getTemplate(document, req, res) {
    var Type = mongoose.model('Type');
    var Template = mongoose.model('Template');

    // first get the path to this template
    document.getPath(function(err, path) {
        document.path = path;

        // populte the document's type
        Type.populate(document.type, {
            path: 'template'
        }, function(err, documentType) {

            if (err) {

                return components.errors[400](req, res, err);

            } else if (!documentType) {

                return components.errors[400](req, res, 'A type must be specified for all items');


            } else {

                // populate the tree stack and compose blocks
                var template = new Template(documentType.template);
                var isJadeTemplate = /\.jade$/.test(template.name);


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
                                    sync = false;
                                } else {
                                    compilerOrError(document, req, res, function(err, html) {
                                        currentNode.text = currentNode.text.replace(regex, html) || '';
                                        sync = false;
                                    });
                                }


                                // THIS IS A HACK
                                // blocking wait until template is compiled into html
                                while (sync) {
                                    deasync.runLoopOnce();
                                }

                            });
                        } else {
                            accumulator = {};
                        }

                        if (currentNode.parent) {
                            var matches = currentNode.text.match(regex.global) || [];

                            matches.map(function(match) {

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

                            if (isJadeTemplate) {
                                console.log('Rendering a jade template');
                            }
                            var compilerOrError = compileTemplate(text, isJadeTemplate);

                            if (!_.isFunction(compilerOrError)) {
                                console.error(compilerOrError);
                                return components.errors[400](req, res, JSON.stringify(compilerOrError.message));
                            }



                            compilerOrError(document, req, res, function(err, html) {
                                var properties = _.indexBy(document.properties, 'name');
                                var result = html;
                                try {
                                    result = JSON.parse(html);
                                    properties.contentType = {
                                        value: 'application/json'
                                    };
                                    res.json(JSON.parse(html));
                                } catch (e) {
                                    console.log('Could not parse result as JSON, sending plain html');
                                    res.send(html);
                                }
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

/**
 * getTemplateById
 * @param req<object> - the express request handle
 * @param res<object> - the express response handle
 * @async - Dispatches responsibility for sending response to getTemplate
 * Using the documentId url parameter (as parsed by express) find a document
 * resource and generate the related HTML template
 */

function getTemplateById(req, res) {

    var documentId = req.params.documentId;

    var Document = mongoose.model('Document');

    var documentQuery = Document.findById(documentId);

    documentQuery.populate('type');

    documentQuery.exec(function(err, queryresult) {



        if (err || !queryresult) {

            return components.errors[404](req, res);

        }

        getTemplate(queryresult, req, res);

    });

}

/**
 * getTemplateByPath
 * @param req<object> - the express request handle
 * @param res<object> - the express response handle
 * @async - Dispatches responsibility for sending response to getTemplateById
 * Parse the not prefix portion of the url to identify the Document path 
 * Document path is identified as the concatination of all parent aliases with 
 * and the current document's alias
 */

function getTemplateByPath(req, res) {

    var documentPath = req.url;

    var Document = mongoose.model('Document');

    function getTemplate(err, document) {
        if (err) {
            return components.errors[404](req, res);
        } else {

            req.params.documentId = document;
            getTemplateById(req, res);
        }
    }

    if (documentPath === '/') {
        Document.findOne({
            isHomePage: true
        }).exec(getTemplate);
    } else {
        Document.findByPath(documentPath, getTemplate);
    }


}




module.exports = {
    viewById: getTemplateById,
    viewByPath: getTemplateByPath
};
