'use strict';

angular.module('toastio')
  .config(function ($stateProvider) {
    $stateProvider
      .state('content.types', {
        url: '/types',
        templateUrl: 'app/types/types.html',
        controller: 'TypesCtrl'
      });
  });