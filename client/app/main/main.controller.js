'use strict';

angular.module('toastio')
    .controller('MainCtrl', ['$scope', '$state', '$location', 'authenticationSvc', 'userSessionSvc', function($scope, $state, $location, authenticationSvc, userSessionSvc) {

        this.userName = 'Example user';
        this.helloText = 'Welcome in SeedProject';
        this.descriptionText = 'It is an application skeleton for a typical AngularJS web app. You can use it to quickly bootstrap your angular webapp projects and dev environment for these projects.';

    }]);
