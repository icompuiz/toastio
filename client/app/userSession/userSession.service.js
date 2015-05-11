'use strict';

angular.module('toastio')
	.service('userSessionSvc', ['$q', '$http', '$state', 'Restangular', 
		function($q, $http) {
		// AngularJS will instantiate a singleton by calling "new" on this function


		var session = {
			user: {
				username: 'public'
			}
		};

		function whoami(cb) {
			$http.get('/api/command/who').success(function(me) {
				session.user = me;

				cb(null, me);
			}).error(function(err) {
				cb(err);
			});

		}

		return {

			session: session,
			set: function(user) {
				session.user = user;
			},
			sync: function() {
				var deferred = $q.defer();

				whoami(function(err, me) {

					if (err) {
						return deferred.reject(err);
					}

					deferred.resolve(me);

				});

				return deferred.promise;
			}
		};


	}]);
