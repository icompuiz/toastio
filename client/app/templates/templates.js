'use strict';

angular.module('toastio')
  .config(function ($stateProvider) {
    $stateProvider
      .state('content.templates', {
        url: '/templates',
        templateUrl: 'app/templates/templates.html',
        controller: 'TemplatesCtrl'
      });
  });