'use strict';

var mongoose = require('mongoose');
var async = require('async');
var _ = require('lodash');

exports.search = function(req, res) {

    var query = req.body.q;
    console.log(query);
    var nameconditions = {
        $regex: '.*' + query + '.*',
        $options: 'i'
    };


    function searchFileSystem(searchFileSystemCb) {

        var FileSystemApi = require('../filesystem/filesystem.controller.js');
        FileSystemApi.search({
            name: query
        }, function(err, results) {

            if (err) {
                return searchFileSystemCb(err);
            }

            searchFileSystemCb(null, _.omit(results, 'name'));

        });



    }

    function searchDocuments(searchDocumentsCb) {

        var DocumentModel = mongoose.model('Document');
        DocumentModel.find({
            name: nameconditions
        }).exec(function(err, results) {

            if (err) {
                return searchDocumentsCb(err);
            }

            searchDocumentsCb(null, results);

        });

    }

    function searchTypes(searchTypesCb) {
        var TypeModel = mongoose.model('Type');
        TypeModel.find({
            name: nameconditions
        }).exec(function(err, results) {

            if (err) {
                return searchTypesCb(err);
            }

            searchTypesCb(null, results);

        });
    }

    function searchTemplates(searchTemplatesCb) {
        var TemplateModel = mongoose.model('Template');
        TemplateModel.find({
            name: nameconditions
        }).exec(function(err, results) {

            if (err) {
                return searchTemplatesCb(err);
            }

            searchTemplatesCb(null, results);

        });
    }

    function searchScripts(searchScriptsCb) {
        var ScriptModel = mongoose.model('Script');
        ScriptModel.find({
            name: nameconditions
        }).exec(function(err, results) {

            if (err) {
                return searchScriptsCb(err);
            }

            searchScriptsCb(null, results);

        });
    }

    function searchBlocks(searchBlocksCb) {
        var BlockModel = mongoose.model('Block');
        BlockModel.find({
            name: nameconditions
        }).exec(function(err, results) {

            if (err) {
                return searchBlocksCb(err);
            }

            searchBlocksCb(null, results);

        });
    }

    async.parallel({
        FileSystem: searchFileSystem,
        Documents: searchDocuments,
        Types: searchTypes,
        Templates: searchTemplates,
        Scripts: searchScripts,
        Blocks: searchBlocks
    }, function(err, results) {

        if (err) {
            return res.status(400).send(err);
        }

        return res.status(200).json(results);

    });

};
