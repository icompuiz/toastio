'use strict';

angular.module('toastio')
  .config(function ($stateProvider) {
    $stateProvider
      .state('media', {
      	parent: 'main',
        url: 'media',
        templateUrl: 'app/media/media.html',
        controller: 'MediaCtrl'
      })
      .state('media.folder', {
      	parent: 'main',
        url: 'media/:folderid',
        templateUrl: 'app/media/media.html',
        controller: 'MediaCtrl'
      })
  });