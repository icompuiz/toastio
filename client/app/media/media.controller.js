/* global _: true */

'use strict';

angular.module('toastio')
    .controller('MediaCtrl', function($scope, $state, $stateParams, $modal, Restangular, PopupSvc) {

        function loadFolder(folderDoc) {

            $scope.formdata = folderDoc;

            var groupedItems = _.groupBy($scope.formdata.items, '_class');

            $scope.formdata.folders = groupedItems.FileSystemDirectory;
            $scope.formdata.files = (groupedItems.FileSystemFile || []).concat(groupedItems.FileSystemImageFile || []);

            $scope.formdata.files = _.map($scope.formdata.files, function(d) {
                d.isImage = d.type.match('image');
                return d;
            });

            if ($scope.formdata.path && $scope.formdata.path.length) {
                $scope.siteroot = $scope.formdata.path.shift();
            } else {
                $scope.siteroot = $scope.formdata;
                $scope.isSiteRoot = true;
            }

        }

        function reloadDirectory() {
            if ($stateParams.folderid) {

                Restangular.one('directories', $stateParams.folderid).get({
                    populate: 'items'
                }).then(function(directory) {
                    loadFolder(directory);
                });



            } else {
                Restangular.one('filesystem').get({
                    populate: 'items'
                }).then(function(rootdirectory) {
                    loadFolder(rootdirectory);
                });
            }
        }


        $scope.createFile = function() {

            var modalSettings = {
                controller: 'FileCtrl',
                templateUrl: 'app/media/file/create.html'
            };

            $modal.open(modalSettings);

        };
        $scope.createFolder = function() {

            var modalSettings = {
                controller: 'FolderCtrl',
                templateUrl: 'app/media/folder/create.html'
            };

            $modal.open(modalSettings);
        };

        $scope.deleteFolder = function(directory) {

            PopupSvc.confirm('Are you sure? This action is irreversible.').then(function(confirmed) {

                if (confirmed) {
                    Restangular
                        .one('directories', directory._id)
                        .remove()
                        .then(function() {
                            reloadDirectory();
                        });
                }

            });

        };
        $scope.deleteFile = function(file) {

            PopupSvc.confirm('Are you sure? This action is irreversible.').then(function(confirmed) {

                if (confirmed) {
                    Restangular
                        .one('files', file._id)
                        .remove()
                        .then(function() {
                            reloadDirectory();
                        });
                }

            });

        };

        reloadDirectory();



    });
