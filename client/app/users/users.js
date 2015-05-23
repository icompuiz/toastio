'use strict';

angular.module('toastio')
  .config(function ($stateProvider) {
        $stateProvider
            .state('users', {
                parent: 'settings',
                url: '/users',
                template: '<div ui-view=""></div>',
                abstract: true
            })
            .state('users.list', {
                url: '',
                templateUrl: 'app/users/users-list.html',
                controller: 'UsersCtrl'
            })
            .state('users.add', {
                url: '/add',
                templateUrl: 'app/users/users-edit.html',
                controller: 'UsersEditCtrl'
            })
            .state('users.edit', {
                url: '/edit/:userid',
                templateUrl: 'app/users/users-edit.html',
                controller: 'UsersEditCtrl'
            });
  });