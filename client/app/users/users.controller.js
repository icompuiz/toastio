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
    .controller('UsersEditCtrl', function($scope, $state, $timeout, $stateParams, $log, Restangular) {

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

        var saveBtnText = 'Save';
        $scope.saveBtnText = saveBtnText;
        $scope.saveState = 'ready';

        $scope.submit = function() {

            $scope.saveBtnText = 'Submitting...';
            $scope.saveState = 'waiting';

            if ($scope.formdata._id) {

                var formdata = $scope.formdata.clone();

                var putRequest = formdata.put();

                putRequest.then(function() {

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
