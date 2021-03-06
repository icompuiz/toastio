'use strict';

angular.module('toastio')
    .config(function($stateProvider) {
        $stateProvider
            .state('blocks', {
                parent: 'content',
                url: '/blocks',
                template: '<div ui-view=""></div>',
                abstract: true
            })
            .state('blocks.list', {
                url: '/:blockid',
                templateUrl: 'app/blocks/blocks-list.html',
                controller: 'BlocksCtrl'
            })
            .state('blocks.add', {
                url: '/add/:parentid',
                templateUrl: 'app/blocks/blocks-edit.html',
                controller: 'BlocksEditCtrl',
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
            .state('blocks.edit', {
                url: '/edit/:blockid',
                templateUrl: 'app/blocks/blocks-edit.html',
                controller: 'BlocksEditCtrl',
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
