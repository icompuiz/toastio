'use strict';

angular.module('toastio')
    .config(function($stateProvider) {
        $stateProvider
            .state('variables', {
                parent: 'settings',
                url: '/variables',
                templateUrl: 'app/variables/variables.html',
                controller: 'VariablesCtrl'
            });
    });
