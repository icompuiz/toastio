'use strict';

angular.module('toastio')
    .config(function($stateProvider) {
        $stateProvider
            .state('main.file', {
                url: '/file',
                template: '<ui-view></ui-view>',
            })
            .state('main.file.create', {
                url: '/create/:folderid',
                templateUrl: 'app/media/file/file-create.html',
                controller: 'FileCreateCtrl',
                resolve: {
                    loadPlugin: function($ocLazyLoad) {
                        return $ocLazyLoad.load([{
                            files: ['lazy_components/dropzone/css/basic.css', 'lazy_components/dropzone/css/dropzone.css', 'lazy_components/dropzone/dropzone.js']
                        }]);
                    }
                }
            });
    });
