'use strict';

angular.module('toastio')
	.config(function($stateProvider) {
		$stateProvider
			.state('password-reset', {
				url: '/toastio/password-reset',
				templateUrl: 'app/password-reset/password-reset.html',
				controller: 'PasswordResetCtrl'
			});
	});
