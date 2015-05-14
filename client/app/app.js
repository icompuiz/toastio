'use strict';

angular.module('toastio', [
				'ngCookies',
				'ngResource',
				'ngSanitize',
				'btford.socket-io',
				'ui.router',
				'ui.bootstrap',
				'oc.lazyLoad',
				'restangular',
				'ngCkeditor',
				'inspinia'
		])
		.config(function($stateProvider, $urlRouterProvider, $locationProvider, RestangularProvider, $ocLazyLoadProvider) {

				$urlRouterProvider
						.otherwise('/toastio/home');

				$ocLazyLoadProvider.config({
						// Set to true if you want to see what and when is dynamically loaded
						debug: false
				});


				$locationProvider.html5Mode(true);

				RestangularProvider.setBaseUrl('/api');

				RestangularProvider.setRestangularFields({
						id: '_id'
				});

		}).run(['$rootScope', '$state', function($rootScope, $state) {
				$rootScope.$state = $state;
		}]);
