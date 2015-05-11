'use strict';

angular.module('toastio')
  .config(function ($stateProvider) {
    $stateProvider
      .state('content', {
      	parent: 'main',
        url: 'content',
        template: '<div ui-view=""></div>',
      });
  });