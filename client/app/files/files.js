'use strict';

angular.module('toastio')
  .config(function ($stateProvider) {
    $stateProvider
      .state('files', {
      	parent: 'main',
        url: 'files',
        templateUrl: 'app/files/files.html',
      });
  });