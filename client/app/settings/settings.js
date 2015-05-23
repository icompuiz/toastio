'use strict';

angular.module('toastio')
    .config(function($stateProvider) {
        $stateProvider
            .state('settings', {
                parent: 'main',
                url: 'settings',
                template: '<div ui-view=""></div>',
                abstract: true
            });
    });
