'use strict';

angular.module('toastio')
    .config(function($stateProvider) {
        $stateProvider
            .state('search', {
                parent: 'main',
                url: '/search',
                template: '<div ui-view=""></div>',
                abstract: true
            })
            .state('search.results', {
                url: '?query',
                templateUrl: 'app/search/search.html',
                controller: 'SearchCtrl'
            });
    });
