'use strict';

angular.module('toastio')
	.service('userSessionSvc', ['$q', '$http', '$state', 'Restangular', 
		function($q, $http,$state, Restangular) {
		// AngularJS will instantiate a singleton by calling "new" on this function


		var session = {
			user: {
				username: 'public'
			},
			organization: {},
			organizations: []
		};

		function whoami(cb) {
			$http.get('/api/command/who').success(function(me) {
				session.user = me;

				cb(null, me);
			}).error(function(err) {
				cb(err);
			});

		}

		function setOrganization(org) {

			session.organization = org;

			if (org) {			
				session.user.mruOrgs.unshift(org);
				session.user.mruOrgs = session.user.mruOrgs.splice(0, 5);

				session.user.mruOrgs = _.uniq(session.user.mruOrgs, '_id');

				var userRequest = Restangular.one('users', session.user._id).get({
					select: 'username'
				});
				userRequest.then(function(user) {

					user.mruOrgs = session.user.mruOrgs.map(function(item) {
						return item._id;
					});

					user.put();
				});
			}



		}

		function updateOrganizations(updateOrganizationsCb) {

			updateOrganizationsCb = updateOrganizationsCb || angular.noop;

			var orgs = Restangular.all('orgs');
			orgs.getList({
				sort: 'name'
			}).then(function(allowedOrganizations) {

				if (session.user.mruOrgs) {
					session.organizations = session.user.mruOrgs.concat(allowedOrganizations).splice(0, 5);
					session.organizations = _.uniq(session.organizations, '_id');
				} else {
					session.organizations = allowedOrganizations;
				}

				if (!session.organization._id) {
					setOrganization(session.organizations[0]);
				}

				updateOrganizationsCb();

			});

		}

		return {

			session: session,
			set: function(user) {
				session.user = user;
				updateOrganizations();
			},
			sync: function() {
				var deferred = $q.defer();

				whoami(function(err, me) {

					if (err) {
						return deferred.reject(err);
					}

					if ('public' !== me.username) {
						updateOrganizations(function() {
							deferred.resolve(me);
						});
					} else {
						deferred.resolve(me);
					}

				});

				return deferred.promise;
			},
			setOrganization: setOrganization,
			updateOrganizations: updateOrganizations

		};


	}]);
