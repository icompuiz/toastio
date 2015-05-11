'use strict';

angular.module('toastio')
    .controller('MainCtrl', ['$scope', '$state', '$location', 'authenticationSvc', 'userSessionSvc', function($scope, $state, $location, authenticationSvc, userSessionSvc) {

        this.session = userSessionSvc.session;

        this.logout = function() {

            authenticationSvc.logout().then(function() {

            	$state.go('login');

            });


        };

    }]);
