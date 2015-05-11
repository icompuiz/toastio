'use strict';

angular.module('toastio')
    .controller('FolderCtrl', function($scope, $stateParams, $state, $log, Restangular) {

        var flag = true;

        function loadFolder(folderDoc) {

            $scope.formdata = folderDoc;

            $scope.folders = $scope.formdata.path;

            if ($scope.folders && $scope.folders.length) {
                $scope.siteroot = $scope.folders.shift();
            }


        }

        function loadParentDirectory(parentDirectoryDoc) {


            $scope.folders = parentDirectoryDoc.path;

            $scope.folders.push(parentDirectoryDoc);

            if ($scope.folders && $scope.folders.length) {
                $scope.siteroot = $scope.folders.shift();
            }


        }


        $scope.formdata = {};

        $scope.alias = '';

        $scope.folders;

        $scope.submit = function() {

            if ($scope.formdata.alias) {
                $scope.formdata.alias.trim();
            }

            if ($scope.formdata._id) {

                var formdata = $scope.formdata.clone();

                formdata.items = _.pluck(formdata.items, '_id');
                delete formdata.path;

                var putRequest = formdata.put();

            } else {
                var postRequest = Restangular.all('directories').post($scope.formdata);
                postRequest.then(function(postResult) {
                    $log.debug(postResult);
                    $scope.formdata = postResult;

                    $state.go('media.folder', {
                        folderid: $scope.formdata._id
                    });

                }, function(error) {
                    $log.error(error);
                });
            }

        };

        $scope.delete = function() {

            $scope.formdata.remove().then(function() {

                $state.go('media.folder', {
                    folderid: $scope.formdata.directory
                });

            });


        };

        $scope.cancel = function() {

            $state.go('media.folder', {
                folderid: $stateParams.directory || $stateParams.folderid
            });

        }

        var stopWatchingName = $scope.$watch('formdata.name', function(newValue) {
            if (!_.isEmpty(newValue)) {
                $scope.formdata.alias = newValue.toLowerCase().replace(/\W/, '_');
            }
        });

        $scope.$watch('formdata.alias', function(newValue) {
            if (!_.isEmpty(newValue)) {
                $scope.formdata.alias = newValue.replace(/\W/, '_');
            }
        });

        if ($stateParams.directory) {

            $scope.formdata.directory = $stateParams.directory;

            Restangular.one('directories', $stateParams.directory).get({
                populate: 'items'
            }).then(function(directoryDoc) {
                loadParentDirectory(directoryDoc);
            });

        } else if ($stateParams.folderid) {

            Restangular.one('directories', $stateParams.folderid).get({
                populate: 'items'
            }).then(function(directoryDoc) {
                    loadFolder(directoryDoc);
                    if ($scope.formdata.alias) {
                        stopWatchingName();
                    }
                },
                function(error) {
                    $log.error(error);
                });
        }

        $scope.aliasManuallyChanged = function() {
            if (flag) {
                stopWatchingName();
                flag = false;
            }
        };

    });
