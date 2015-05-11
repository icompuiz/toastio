'use strict';

angular.module('toastio')
	.config(function($stateProvider) {
		$stateProvider
			.state('login', {
				url: '/toastio/login',
				templateUrl: 'app/login/login.html',
				controller: 'LoginCtrl',
				resolve: {
					currentUser: ['userSessionSvc', function(userSessionSvc) {
						return userSessionSvc.sync();
					}]
				}
			});
	});
