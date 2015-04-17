'use strict';

angular.module('toastio')
  .config(function ($stateProvider) {
    $stateProvider
      .state('content', {
      	parent: 'main',
        url: 'content',
        templateUrl: 'app/content/content.html',
      });
  });