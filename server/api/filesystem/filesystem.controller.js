'use strict';

var mongoose = require('mongoose'),
    _ = require('lodash'),
    async = require('async');

var components = require('../../components');
var apiUtils = components.apiUtils;

function searchFileSystem(query, searchFileSystemCb) {

    var directorySearchConfig = {
        conditions: {
            $and: [{
                _class: 'FileSystemDirectory'
            }]
        }
    };
    var fileSearchConfig = {
        conditions: {
            $and: [{
                _class: {
                    $ne: 'FileSystemDirectory'
                }
            }]
        }
    };

    var hasFileParams = false;
    var hasDirParams = false;

    if (query.sort) {
        directorySearchConfig.sort = query.sort;
        fileSearchConfig.sort = query.sort;
    }

    if (query.fileSort) {
        fileSearchConfig.sort = query.fileSort;
    }

    if (query.directorySort) {
        directorySearchConfig.sort = query.directorySort;
    }

    if (query.limit) {
        directorySearchConfig.limit = query.limit;
        fileSearchConfig.limit = query.limit;
    }

    if (query.fileLimit) {
        fileSearchConfig.limit = query.fileLimit;
    }

    if (query.directoryLimit) {
        directorySearchConfig.limit = query.directoryLimit;
    }


    if (query.id) {
        hasDirParams = true;
        hasFileParams = true;
        // directorySearchConfig.conditions._id = query.id;
        // fileSearchConfig.conditions._id = query.id;
        var idCond = {
            _id: query.id
        };

        directorySearchConfig.conditions.$and.push(idCond);
        fileSearchConfig.conditions.$and.push(idCond);

    }

    if (query.name) {
        hasDirParams = true;
        hasFileParams = true;

        var nameCond = {
            name: {
                $regex: '.*' + query.name + '.*',
                $options: 'i'
            }
        };

        directorySearchConfig.conditions.$and.push(nameCond);
        fileSearchConfig.conditions.$and.push(nameCond);

    }

    if (query.directoryId) {
        hasDirParams = true;

        var idCond = {
            _id: query.directoryId
        };

        directorySearchConfig.conditions.$and.push(idCond);
    }

    if (query.directoryName) {
        hasDirParams = true;


        var nameCond = {
            name: {
                $regex: '.*' + query.directoryName + '.*',
                $options: 'i'
            }
        };

        directorySearchConfig.conditions.$and.push(nameCond);
    }

    if (query.fileName) {
        hasFileParams = true;
        var nameCond = {
            name: {
                $regex: '.*' + query.fileName + '.*',
                $options: 'i'
            }
        };

        fileSearchConfig.conditions.$and.push(nameCond);
    }


    if (query.fileId) {
        hasFileParams = true;

        var idCond = {
            _id: query.fileId
        };

        fileSearchConfig.conditions.$and.push(idCond);
    }

    if (query.fileType) {
        hasFileParams = true;

        var typeCond = {
            type: {
                $regex: '.*' + query.fileType + '.*',
                $options: 'i'
            }
        };

        fileSearchConfig.conditions.$and.push(typeCond);
        directorySearchConfig.conditions.$and.push(typeCond);

    }

    if (query.fileDirectory) {
        hasFileParams = true;

        var fileDirDCond = {
            directory: query.fileDirectory
        };

        fileSearchConfig.conditions.$and.push(fileDirDCond);
        directorySearchConfig.conditions.$and.push(fileDirDCond);
    }

    if (!(hasFileParams || hasDirParams)) {
        var err = new Error('Please specify some valid query parameters');
        return searchFileSystemCb(err);
    }

    console.log(JSON.stringify(fileSearchConfig, null, ' '));

    function searchFiles(searchFilesDoneCB) {

        if (!hasFileParams) {
            return searchFilesDoneCB();
        }
        var File = mongoose.model('FileSystemFile');
        var fileQuery = File.find(fileSearchConfig.conditions);



        if (fileSearchConfig.sort) {
            fileQuery.sort(fileSearchConfig.sort);
        }

        if (fileSearchConfig.limit) {
            fileQuery.limit(fileSearchConfig.limit);
        }


        fileQuery.exec(function(err, files) {

            if (err) {
                return searchFilesDoneCB(err);
            }

            async.filter(files, function(fileDoc, filterFileCb) {
                fileDoc.isAllowed('read', function(err, isAllowed) {
                    if (err) {
                        return filterFileCb(false);
                    }

                    filterFileCb(isAllowed);
                });
            }, function(files) {
                searchFilesDoneCB(null, files);
            });

        });
    }

    function searchDirectories(searchDirectoriesDoneCB) {

        if (!hasDirParams) {
            return searchDirectoriesDoneCB();
        }
        var Directory = mongoose.model('FileSystemDirectory');
        var dirQuery = Directory.find(directorySearchConfig.conditions);

        if (directorySearchConfig.sort) {
            dirQuery.sort(directorySearchConfig.sort);
        }

        if (directorySearchConfig.limit) {
            dirQuery.limit(directorySearchConfig.limit);
        }

        dirQuery.exec(function(err, directories) {

            if (err) {
                return searchDirectoriesDoneCB(err);
            }

            async.filter(directories, function(directoryDoc, filterDirectoryCb) {
                directoryDoc.isAllowed('read', function(err, isAllowed) {
                    if (err) {
                        return filterDirectoryCb(false);
                    }

                    filterDirectoryCb(isAllowed);
                });
            }, function(directories) {
                searchDirectoriesDoneCB(null, directories);
            });


        });
    }

    async.parallel({
        files: searchFiles,
        directories: searchDirectories
    }, function(err, results) {

        if (err) {
            return searchFileSystemCb(err);
        }

        results = results || {
            files: [],
            directories: []
        };
        var searchResults = {
            name: 'Search Results',
            directories: results.directories,
            files: results.files
        };

        searchFileSystemCb(null, searchResults);

    });

}

function getFileByPath(req, res) {

    var filePath = req.url.replace(/^\/(tcms|tmedia|tio)/, '');

    console.log('Get File By Path', filePath);

    var FileSystemFileModel = mongoose.model('FileSystemFile');
    var FileSystemFileCtrl = require('../filesystem.file/filesystem.file.controller.js')

    function getFile(err, fileDoc) {
        if (err) {
            return components.errors[404](req, res);
        }

        if (!fileDoc) {
            return components.errors[404](req, res);
        }

        req.params.id = fileDoc._id;
        FileSystemFileCtrl.downloadFile(req, res);
        
    }

   
    FileSystemFileModel.findByPath(filePath, getFile);


}

exports.search = searchFileSystem;
exports.getFileByPath = getFileByPath;
exports.attach = function(FilesystemResource) {



    var FileSystemItem = require('./filesystem.item.model');

    apiUtils.addPermissionChecks(FilesystemResource, FileSystemItem);

    FilesystemResource.before('get', function(req, res, next) {

        if (!req.params.id) {
            req.quer.where({
                'directory': null
            });
        }

        req.quer.where({
            _class: 'FileSystemDirectory'
        });

        next();

    });

    FilesystemResource.after('get', function(req, res, next) {

        if (!req.params.id) {
            res.locals.bundle = _.first(res.locals.bundle);
        }

        next();

    });

    FilesystemResource.route('search.get', function(req, res) {

        searchFileSystem(req.query, function(err, searchResults) {
            if (err) {
                return res.jsonp(500, {
                    'error': err.message || err
                });
            }

            res.json(200, searchResults);
        });

    });


};
