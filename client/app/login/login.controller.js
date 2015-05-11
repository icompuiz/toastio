'use strict';

angular.module('toastio')
	.controller('LoginCtrl', ['$scope', '$state', '$timeout', 'authenticationSvc', function($scope, $state, $timeout, authenticationSvc) {

		if (authenticationSvc.isLoggedIn()) {
			$state.go('main.home');
		}

		$scope.user = {
			username: '',
			password: '',
			rememberme: false
		};

		$scope.flash = {
			type: '',
			message: ''
		};

		var loginBtnText = 'Login';
		$scope.loginBtnText = loginBtnText;
		$scope.loginState = 'ready';

		$scope.login = function() {

			$scope.loginBtnText = 'Logging In...';
			$scope.loginState = 'waiting';

			authenticationSvc.login($scope.user).then(function() {

				$scope.loginState = 'success';
				$scope.loginBtnText = 'Success!';

				$timeout(function() {
					$state.go('main.home');
				}, 500);

			}, function() {

				$scope.loginState = 'failed';
				$scope.loginBtnText = 'Bad username and password combination.';
				$timeout(function() {
					$scope.loginState = 'ready';
					$scope.loginBtnText = loginBtnText;
				}, 2000);

			});

		};

	}]);
