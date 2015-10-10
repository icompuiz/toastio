'use strict';

angular.module('toastio')
    .config(function($stateProvider) {
        $stateProvider
            .state('templates', {
                parent: 'content',
                url: '/templates',
                template: '<div ui-view=""></div>',
                abstract: true
            })
            .state('templates.list', {
                url: '/:templateid',
                templateUrl: 'app/templates/templates-list.html',
                controller: 'TemplatesCtrl'
            })
            .state('templates.add', {
                url: '/add/:parentid',
                templateUrl: 'app/templates/templates-edit.html',
                controller: 'TemplatesEditCtrl',
                resolve: {
                    loadPlugin: function($ocLazyLoad) {
                        return $ocLazyLoad.load([{
                            serie: true,
                            files: ['lazy_components/codemirror/codemirror.css', 'lazy_components/codemirror/ambiance.css', 'lazy_components/codemirror/codemirror.js', 'lazy_components/codemirror/mode/javascript/javascript.js','lazy_components/codemirror/mode/css/css.js','lazy_components/codemirror/mode/xml/xml.js', 'lazy_components/codemirror/mode/htmlmixed/htmlmixed.js']
                        }, {
                            name: 'ui.codemirror',
                            files: ['lazy_components/ui-codemirror/ui-codemirror.min.js']
                        }]);
                    }
                }
            })
            .state('templates.edit', {
                url: '/edit/:templateid',
                templateUrl: 'app/templates/templates-edit.html',
                controller: 'TemplatesEditCtrl',
                resolve: {
                    loadPlugin: function($ocLazyLoad) {
                        return $ocLazyLoad.load([{
                            serie: true,
                            files: ['lazy_components/codemirror/codemirror.css', 'lazy_components/codemirror/ambiance.css', 'lazy_components/codemirror/codemirror.js', 'lazy_components/codemirror/mode/javascript/javascript.js','lazy_components/codemirror/mode/css/css.js','lazy_components/codemirror/mode/xml/xml.js', 'lazy_components/codemirror/mode/htmlmixed/htmlmixed.js']
                        }, {
                            name: 'ui.codemirror',
                            files: ['lazy_components/ui-codemirror/ui-codemirror.min.js']
                        }]);
                    }
                }
            });
    });
