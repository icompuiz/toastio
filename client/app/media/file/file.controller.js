'use strict';

angular.module('toastio')
    .controller('FileCreateCtrl', function($scope, $state, $stateParams, Restangular) {

        var folderid = null;

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

            Restangular.one('directories', $stateParams.folderid).get({
                populate: 'items'
            }).then(function(directory) {
                loadFolder(directory);
            });
        }

        function onAdded(file) {

        }

        function onSuccess(folderid, file, json) {

            $state.go('media.folder', {
                folderid: folderid
            });

        }

        function onDrop(file) {

        }

        if ($stateParams.folderid) {

            reloadDirectory();

            folderid = $stateParams.folderid;
            $scope.dropZoneOptions = {
                path: '/api/directories/' + folderid + '/files',
                onadded: onAdded,
                onsuccess: onSuccess.bind(null, folderid),
                ondrop: onDrop
            };

        } else {

            $state.go('media');

        }

        $scope.files = [];

    });
