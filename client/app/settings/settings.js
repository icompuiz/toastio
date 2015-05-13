'use strict';

angular.module('toastio')
    .config(function($stateProvider) {
        $stateProvider
            .state('settings', {
                parent: 'content',
                url: '/settings',
                template: '<div ui-view=""></div>',
                abstract: true
            })
            .state('settings.variables', {
                url: '/variables',
                templateUrl: 'app/settings/variables/variables.html',
                controller: 'VariablesCtrl'
            });
    });
