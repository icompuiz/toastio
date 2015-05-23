'use strict';

angular.module('toastio')
    .controller('UsersCtrl', function($scope, $state, $stateParams, Restangular, PopupSvc) {

        var _loadUser = angular.noop;

        function onUserLoaded(users) {

            $scope.users = users;

        }

        function onUserNotLoaded() {}

        function loadUser(userid, onSuccess, onError) {
            onSuccess = onSuccess || angular.noop;
            onError = onError || angular.noop;
            var query = Restangular.all('users').getList();
            query.then(onSuccess, onError);
            return query;
        }

        $scope.delete = function(user) {

            PopupSvc.confirm('Are you sure? This action is irreversible.').then(function(confirmed) {

                if (confirmed) {
                    Restangular
                        .one('users', user._id)
                        .remove()
                        .then(function() {
                            _loadUser();
                        });
                }

            });

        };



        // ------------------------------------------------------------*/ scope

        $scope.formdata = {};

        _loadUser = loadUser.bind(this, $stateParams.userid, onUserLoaded, onUserNotLoaded);
        _loadUser();

    })
    .controller('UsersEditCtrl', function($scope, $state, $stateParams, $log, Restangular) {

        var _loadUser = angular.noop;

        function onUserLoaded(userDoc) {

            $scope.formdata = userDoc;

        }

        function onUserNotLoaded() {}

        function loadUser(userid, onSuccess, onError) {
            onSuccess = onSuccess || angular.noop;
            onError = onError || angular.noop;
            var query = Restangular.one('users', userid).get();
            query.then(onSuccess, onError);
            return query;
        }

        $scope.formdata = {};

        $scope.submit = function() {

            if ($scope.formdata._id) {

                var formdata = $scope.formdata.clone();

                var putRequest = formdata.put();

                return putRequest;

            } else {

                $scope.formdata.data = {
                    groupConditions: [{
                        name: 'administrators'
                    }]
                };

                var postRequest = Restangular.all('users').post($scope.formdata);
                postRequest.then(function(postResult) {
                    $log.debug(postResult);
                    $scope.formdata = postResult;

                    $state.go('users.list');

                }, function(error) {
                    $log.error(error);
                });

                return postRequest;
            }

        };

        $scope.delete = function() {

            $scope.formdata.remove().then(function() {
                $state.go('users.list');
            });


        };

        $scope.cancel = function() {
            $state.go('users.list');
        };

        if ($stateParams.userid) {
            _loadUser = loadUser.bind(this, $stateParams.userid, onUserLoaded, onUserNotLoaded);
            _loadUser();
        }

    });
