'use strict';

angular.module('toastio')
	.service('authenticationSvc', ['$http', '$q', 'aclstring', 'userSessionSvc', function($http, $q, aclstring, userSessionSvc) {
		return {
			authorize: function(aclResource, resources, checkOn) {
				checkOn = 'get';

				aclResource = aclstring.create(aclResource);
				aclResource = aclstring.removeQuery(aclResource);

				resources = resources || ['get'];

				var isAllowed = userSessionSvc.session.user.resources[aclResource];
				return isAllowed;
				/*jslint bitwise: false */
			},
			isLoggedIn: function(user) {
				if (user === undefined) {
					user = userSessionSvc.session.user;
				}

				var isPublic = user.username === 'public';

				return !isPublic;
			},
			register: function(user) {
				var deffered = $q.defer();
				$http.post('/register', user).success(function(user) {
					userSessionSvc.set(user);
					deffered.resolve(user);
				}).error(function(error) {
					deffered.reject(error);
				});
				return deffered.promise;
			},
			login: function(user) {
				var deffered = $q.defer();
				$http.post('/login', user).success(function(user) {
					userSessionSvc.set(user);
					deffered.resolve(user);
				}).error(function(error) { // (data, status, headers, config)
					deffered.reject(error);
				});
				return deffered.promise;
			},
			logout: function() {
				var deffered = $q.defer();
				$http.post('/logout').success(function(user) {
					userSessionSvc.set(user);
					deffered.resolve(user);
				}).error(function(error) {
					deffered.reject(error);
				});
				return deffered.promise;
			}
		};
	}]);
