'use strict';

angular.module('toastio')
    .config(function($stateProvider) {
        $stateProvider
            .state('types', {
                parent: 'content',
                url: '/types',
                template: '<div ui-view=""></div>',
                abstract: true
            })
            .state('types.list', {
                url: '/:typeid',
                templateUrl: 'app/types/types-list.html',
                controller: 'TypesCtrl'
            })
            .state('types.add', {
                url: '/add/:parentid',
                templateUrl: 'app/types/types-edit.html',
                controller: 'TypesEditCtrl',
                resolve: {
                    loadPlugin: function($ocLazyLoad) {
                        return $ocLazyLoad.load([{
                            name: 'localytics.directives',
                            files: ['lazy_components/chosen/chosen.css', 'lazy_components/chosen/chosen.jquery.js', 'lazy_components/chosen/chosen.js']
                        }]);
                    }
                }
            })
            .state('types.edit', {
                url: '/edit/:typeid',
                templateUrl: 'app/types/types-edit.html',
                controller: 'TypesEditCtrl',
                resolve: {
                    loadPlugin: function($ocLazyLoad) {
                        return $ocLazyLoad.load([{
                            name: 'localytics.directives',
                            files: ['lazy_components/chosen/chosen.css', 'lazy_components/chosen/chosen.jquery.js', 'lazy_components/chosen/chosen.js']
                        }]);
                    }
                }
            });
    });
