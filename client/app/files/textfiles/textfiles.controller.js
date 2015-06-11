'use strict';

angular.module('toastio')
    .controller('TextFilesEditCtrl', function($scope, $state, $stateParams, $timeout, Restangular) {

        var fileid = null;

        $scope.editorOptions = {
            lineNumbers: true,
            matchBrackets: true,
            styleActiveLine: true,
            theme: 'ambiance',
            indentWithTabs: true,
        };

        function loadFile(fileDoc) {

            $scope.formdata = fileDoc;

            var groupedItems = _.groupBy($scope.formdata.items, '_class');

            $scope.formdata.folders = groupedItems.FileSystemDirectory;

            var mode;
            if ($scope.formdata.type.match('html') || $scope.formdata.type.match('htm')) {
                mode = 'htmlmixed';
            } else if ($scope.formdata.type.match('jade')) {
                mode = 'jade';
            } else if ($scope.formdata.type.match('javascript')) {
                mode = 'javascript';
            } else if ($scope.formdata.type.match('css')) {
                mode = 'css';
            } else if ($scope.formdata.type.match('xml')) {
                mode = 'xml';
            }

            $scope.editorOptions.mode = mode;

            if ($scope.formdata.path && $scope.formdata.path.length) {
                $scope.siteroot = $scope.formdata.path.shift();
            } else {
                $scope.siteroot = $scope.formdata;
                $scope.isSiteRoot = true;
            }

            getText();

        }

        function getText() {

            Restangular.one('files', $scope.formdata._id).one('download').get().then(function(fileText) {
                $scope.formdata.text = fileText;
            }, function(err) {
                $scope.formdata.text = err;
            });

        }

        function getFile(fileid) {
            Restangular.one('files', fileid).get().then(function(fileDoc) {
                loadFile(fileDoc);
            }, function() {
                $state.go('media');
            });
        }


        if ($stateParams.fileid) {

            fileid = $stateParams.fileid;

            getFile(fileid);

        } else {

            $state.go('media');

        }

        var saveBtnText = 'Save';
        $scope.saveBtnText = saveBtnText;
        $scope.saveState = 'ready';

        $scope.cancel = function() {

            $state.go('media.folder', {
                folderid: $scope.formdata.directory
            });

        };

        $scope.submit = function() {

            if ($scope.formdata.alias) {
                $scope.formdata.alias.trim();
            }

            $scope.saveBtnText = 'Submitting...';
            $scope.saveState = 'waiting';

            if ($scope.formdata._id) {

                var postRequest = Restangular.all(['files', fileid, 'edit'].join('/')).post($scope.formdata);
                postRequest.then(function() {

                    $scope.saveState = 'success';
                    $scope.saveBtnText = 'Success!';

                    $timeout(function() {
                        $scope.saveState = 'ready';
                        $scope.saveBtnText = saveBtnText;
                    }, 500);


                }, function() {

                    $scope.saveState = 'failed';
                    $scope.saveBtnText = 'See below for error details.';

                    $timeout(function() {
                        $scope.saveState = 'ready';
                        $scope.saveBtnText = saveBtnText;
                    }, 2000);
                });

                return postRequest;
            }

        };



    });
