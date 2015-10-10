(function PasswordReset() {

	angular
		.module('toastio')
		.controller('PasswordResetCtrl', PasswordResetCtrl);

	PasswordResetCtrl.$inject = ['$scope', 'Restangular'];

	function PasswordResetCtrl($scope, Restangular) {

		$scope.submit = submit;

		function submit() {

			Restangular
				.all('password-reset')
				.post($scope.formdata)
				.then(function(result) {

				});

		}

	}


})();