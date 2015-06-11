'use strict';

angular.module('toastio')
    .config(function($stateProvider) {
        $stateProvider
            .state('scripts', {
                parent: 'content',
                url: '/scripts',
                template: '<div ui-view=""></div>',
                abstract: true
            })
            .state('scripts.list', {
                url: '/:scriptid',
                templateUrl: 'app/scripts/scripts-list.html',
                controller: 'ScriptsCtrl'
            })
            .state('scripts.add', {
                url: '/add',
                templateUrl: 'app/scripts/scripts-edit.html',
                controller: 'ScriptsEditCtrl',
                resolve: {
                    loadPlugin: function($ocLazyLoad) {
                        return $ocLazyLoad.load([{
                            serie: true,
                            files: ['lazy_components/codemirror/codemirror.css', 'lazy_components/codemirror/ambiance.css', 'lazy_components/codemirror/codemirror.js', 'lazy_components/codemirror/mode/javascript/javascript.js']
                        }, {
                            name: 'ui.codemirror',
                            files: ['lazy_components/ui-codemirror/ui-codemirror.min.js']
                        }]);
                    }
                }
            })
            .state('scripts.edit', {
                url: '/edit/:scriptid',
                templateUrl: 'app/scripts/scripts-edit.html',
                controller: 'ScriptsEditCtrl',
                resolve: {
                    loadPlugin: function($ocLazyLoad) {
                        return $ocLazyLoad.load([{
                            serie: true,
                            files: ['lazy_components/codemirror/codemirror.css', 'lazy_components/codemirror/ambiance.css', 'lazy_components/codemirror/codemirror.js', 'lazy_components/codemirror/mode/javascript/javascript.js']
                        }, {
                            name: 'ui.codemirror',
                            files: ['lazy_components/ui-codemirror/ui-codemirror.min.js']
                        }]);
                    }
                }
            });
    });
