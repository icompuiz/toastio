'use strict';

angular.module('toastio')
  .config(function ($stateProvider) {
    $stateProvider
      .state('main.folder', {
      	abstract: true,
        url: 'folder',
        template: '<ui-view></ui-view>'
      })
      .state('main.folder.create', {
        url: '/create/:directory',
        templateUrl: 'app/media/folder/folder-edit.html',
        controller: 'FolderCtrl'
      })
      .state('main.folder.edit', {
        url: '/edit/:folderid',
        templateUrl: 'app/media/folder/folder-edit.html',
        controller: 'FolderCtrl'
      });
  });