'use strict';

angular.module('toastio')
  .config(function ($stateProvider) {
    $stateProvider
      .state('content.documents', {
        url: '/documents',
        templateUrl: 'app/documents/documents.html',
        controller: 'DocumentsCtrl'
      });
  });