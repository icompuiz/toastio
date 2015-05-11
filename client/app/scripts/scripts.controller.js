'use strict';

angular.module('toastio')
    .controller('ScriptsCtrl', function($scope, $state, $stateParams, Restangular, PopupSvc) {

        var _loadScript = angular.noop;

        function onScriptLoaded(scripts) {

            $scope.scripts = scripts;

        }

        function onScriptNotLoaded() {}

        function loadScript(scriptid, onSuccess, onError) {
            onSuccess = onSuccess || angular.noop;
            onError = onError || angular.noop;
            var query = Restangular.all('scripts').getList();
            query.then(onSuccess, onError);
            return query;
        }

        $scope.delete = function(script) {

            PopupSvc.confirm('Are you sure? This action is irreversible.').then(function(confirmed) {

                if (confirmed) {
                    Restangular
                        .one('scripts', script._id)
                        .remove()
                        .then(function() {
                            _loadScript();
                        });
                }

            });

        };



        // ------------------------------------------------------------*/ scope

        $scope.formdata = {};

        _loadScript = loadScript.bind(this, $stateParams.scriptid, onScriptLoaded, onScriptNotLoaded);
        _loadScript();

    })
    .controller('ScriptsEditCtrl', function($scope, $state, $stateParams, $log, Restangular) {

        var _loadScript = angular.noop;

        function onScriptLoaded(scriptDoc) {

            $scope.formdata = scriptDoc;

        }

        function onScriptNotLoaded() {}

        function loadScript(scriptid, onSuccess, onError) {
            onSuccess = onSuccess || angular.noop;
            onError = onError || angular.noop;
            var query = Restangular.one('scripts', scriptid).get();
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
            mode: 'javascript'
        };

        $scope.submit = function() {

            if ($scope.formdata.alias) {
                $scope.formdata.alias.trim();
            }

            if ($scope.formdata._id) {

                var formdata = $scope.formdata.clone();

                var putRequest = formdata.put();

                return putRequest;

            } else {

                var postRequest = Restangular.all('scripts').post($scope.formdata);
                postRequest.then(function(postResult) {
                    $log.debug(postResult);
                    $scope.formdata = postResult;

                    $state.go('scripts.list');

                }, function(error) {
                    $log.error(error);
                });

                return postRequest;
            }

        };

        $scope.delete = function() {

            $scope.formdata.remove().then(function() {
                $state.go('scripts.list');
            });


        };

        $scope.cancel = function() {
            $state.go('scripts.list');
        };

        if ($stateParams.scriptid) {
            _loadScript = loadScript.bind(this, $stateParams.scriptid, onScriptLoaded, onScriptNotLoaded);
            _loadScript();
        }

    });
