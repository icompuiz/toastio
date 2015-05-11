'use strict';

angular.module('toastio')
	.directive('logoutButton', function() {
		return {
			restrict: 'EA',
			controller: ['$scope', '$state', 'authenticationSvc', function($scope, $state, authenticationSvc) {
				$scope.logout = function() {
					authenticationSvc.logout().then(function() {
						$state.go('login');
					});
				};
			}],
			link: function(scope, element) {
				
				element.on('click', function() {
					scope.logout();
				});

			}
		};
	});
