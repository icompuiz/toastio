/* globals _: true */

'use strict';


angular.module('toastio').service('PopupSvc', [
	'$log', '$rootScope', '$modal',
	function($log, $rootScope, $modal) {

		var alert = function() {
			var message = '';
			var options = {
				title: 'Alert'
			};

			if (_.isString(arguments[0]) && _.isString(arguments[1])) {
				message = arguments[0];
				options.title = arguments[1];

			}

			if (_.isString(arguments[0]) && _.isObject(arguments[1])) {
				message = arguments[0];
				options = arguments[1];
			}

			if (_.isString(arguments[0]) && !arguments[1]) {
				message = arguments[0];
			}


			var config = {
				controller: 'PopupAlertCtrl',
				templateUrl: 'app/popup/popup-alert.html',
				resolve: {
					popupConfig: function() {
						return {
							message: message,
							options: options
						};
					}
				}
			};

			var modalInstance = $modal.open(config);

			return modalInstance.result;


		};

		var confirm = function() {

			var message = '';
			var options = {
				title: 'Confirm'
			};

			if (_.isString(arguments[0]) && _.isString(arguments[1])) {
				message = arguments[0];
				options.title = arguments[1];
			}

			if (_.isString(arguments[0]) && _.isObject(arguments[1])) {
				message = arguments[0];
				options = arguments[1];
			}

			if (_.isString(arguments[0]) && !arguments[1]) {
				message = arguments[0];
			}

			var config = {
				controller: 'PopupPromptCtrl',
				templateUrl: 'app/popup/popup-prompt.html',
				resolve: {
					popupConfig: function() {
						return {
							message: message,
							options: options
						};
					}
				}
			};

			var modalInstance = $modal.open(config);



			return modalInstance.result;

		};


		this.alert = alert;
		this.confirm = confirm;


	}
]);
