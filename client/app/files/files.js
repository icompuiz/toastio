'use strict';

angular.module('toastio')
    .config(function($stateProvider) {
        $stateProvider
            .state('files', {
                parent: 'content',
                url: '/files',
                template: '<div ui-view=""></div>',
                abstract: true
            })
            .state('files.textfiles', {
                url: '/textfiles',
                template: '<div ui-view=""></div>',
                abstract: true
            })
            .state('files.textfiles.edit', {
                url: '/textfiles/edit/:fileid',
                templateUrl: 'app/files/textfiles/textfiles-edit.html',
                controller: 'TextFilesEditCtrl',
                resolve: {
                    loadPlugin: function($ocLazyLoad) {
                        return $ocLazyLoad.load([{
                            serie: true,
                            files: [
                                'lazy_components/codemirror/codemirror.css',
                                'lazy_components/codemirror/ambiance.css',
                                'lazy_components/codemirror/codemirror.js',
                                'lazy_components/codemirror/mode/javascript/javascript.js',
                                'lazy_components/codemirror/mode/jade/jade.js',
                                'lazy_components/codemirror/mode/htmlmixed/htmlmixed.js',
                                'lazy_components/codemirror/mode/css/css.js',
                                'lazy_components/codemirror/mode/sass/sass.js',
                                'lazy_components/codemirror/mode/xml/xml.js'
                            ]
                        }, {
                            name: 'ui.codemirror',
                            files: ['lazy_components/ui-codemirror/ui-codemirror.min.js']
                        }]);
                    }
                }
            });
    });
