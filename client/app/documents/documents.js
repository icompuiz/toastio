'use strict';

angular.module('toastio')
    .config(function($stateProvider) {
        $stateProvider
            .state('documents', {
                parent: 'content',
                url: '/documents',
                template: '<div ui-view=""></div>',
                abstract: true
            })
            .state('documents.list', {
                url: '/:documentid',
                templateUrl: 'app/documents/documents-list.html',
                controller: 'DocumentsCtrl'
            })
            .state('documents.add', {
                url: '/add/:parentid',
                templateUrl: 'app/documents/documents-edit.html',
                controller: 'DocumentsEditCtrl'
            })
            .state('documents.edit', {
                url: '/edit/:documentid',
                templateUrl: 'app/documents/documents-edit.html',
                controller: 'DocumentsEditCtrl',
                resolve: {
                    loadPlugin: function($ocLazyLoad) {
                        return $ocLazyLoad.load([{
                            name: 'localytics.directives',
                            files: ['lazy_components/chosen/chosen.css', 'lazy_components/chosen/chosen.jquery.js', 'lazy_components/chosen/chosen.js']
                        }, {
                            name: 'summernote',
                            files: ['lazy_components/summernote/summernote.css', 'lazy_components/summernote/summernote-bs3.css', 'lazy_components/summernote/summernote.min.js', 'lazy_components/summernote/angular-summernote.min.js']
                        }]);
                    }
                }
            });
    });
