'use strict';

angular.module('toastio')
    .controller('BlocksCtrl', function($scope, $state, $stateParams, Restangular, PopupSvc) {

        var _loadBlock = angular.noop;

        function onBlockLoaded(blocks) {

            $scope.blocks = blocks;

        }

        function onBlockNotLoaded() {}

        function loadBlock(blockid, onSuccess, onError) {
            onSuccess = onSuccess || angular.noop;
            onError = onError || angular.noop;
            var query = Restangular.all('blocks').getList();
            query.then(onSuccess, onError);
            return query;
        }

        $scope.delete = function(block) {

            PopupSvc.confirm('Are you sure? This action is irreversible.').then(function(confirmed) {

                if (confirmed) {
                    Restangular
                        .one('blocks', block._id)
                        .remove()
                        .then(function() {
                            _loadBlock();
                        });
                }

            });

        };

        // ------------------------------------------------------------*/ scope
        _loadBlock = loadBlock.bind(this, $stateParams.blockid, onBlockLoaded, onBlockNotLoaded);
        _loadBlock();



    })
    .controller('BlocksEditCtrl', function($scope, $state, $stateParams, $log, Restangular) {

        var _loadBlock = angular.noop;

        function onBlockLoaded(blockDoc) {

            $scope.formdata = blockDoc;

        }

        function onBlockNotLoaded() {}

        function loadBlock(blockid, onSuccess, onError) {
            onSuccess = onSuccess || angular.noop;
            onError = onError || angular.noop;
            var query = Restangular.one('blocks', blockid).get();
            query.then(onSuccess, onError);
            return query;
        }

        $scope.formdata = {};

        $scope.alias = '';

        $scope.editorOptions = {
            lineNumbers: true,
            matchBrackets: true,
            styleActiveLine: true,
            theme: 'ambiance',
            indentWithTabs: true,
            mode: 'jade'
        };

        $scope.submit = function() {

            if ($scope.formdata.alias) {
                $scope.formdata.alias.trim();
            }

            if ($scope.formdata._id) {

                var formdata = $scope.formdata.clone();

                formdata.children = _.pluck(formdata.children, '_id');
                if (formdata.parent) {
                    formdata.parent = formdata.parent._id;
                }

                var putRequest = formdata.put();

                return putRequest;

            } else {

                var postRequest = Restangular.all('blocks').post($scope.formdata);
                postRequest.then(function(postResult) {
                    $log.debug(postResult);
                    $scope.formdata = postResult;

                    $state.go('blocks.list');

                }, function(error) {
                    $log.error(error);
                });

                return postRequest;
            }

        };

        $scope.delete = function() {

            $scope.formdata.remove().then(function() {

                $state.go('blocks.list');

            });


        };

        $scope.cancel = function() {

            $state.go('blocks.list', {
                blockid: $stateParams.parentid || $stateParams.blockid
            });

        };

        if ($stateParams.blockid) {
            _loadBlock = loadBlock.bind(this, $stateParams.blockid, onBlockLoaded, onBlockNotLoaded);
            _loadBlock();
        }

    });
