'use strict';

angular.module('toastio')
    .config(['$stateProvider', function($stateProvider) {
        $stateProvider
            .state('main', {
                abstract: true,
                url: '/toastio/',
                templateUrl: 'app/main/main.html'
            })
            .state('main.home', {
                url: "home",
                templateUrl: "app/main/home.html",
                data: {
                    pageTitle: 'Example view'
                }
            });
    }]);
