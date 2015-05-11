'use strict';

angular.module('toastio')
    .config(['$stateProvider', function($stateProvider) {
        $stateProvider
            .state('main', {
                abstract: true,
                url: '/toastio/',
                templateUrl: 'app/main/main.html',
                resolve: {
                    currentUser: ['userSessionSvc', 'authenticationSvc', '$state', '$q', function(userSessionSvc, authenticationSvc, $state, $q) {
                        var magicpants = $q.defer();

                        userSessionSvc.sync().then(function(me) {
                            if (!authenticationSvc.isLoggedIn()) {
                                magicpants.reject(me);
                            } else {
                                magicpants.resolve(me);
                            }
                        });

                        magicpants.promise.then(function() {}, function() {
                            $state.go('login');
                        });

                        return magicpants.promise;
                    }]
                }
            })
            .state('main.home', {
                url: 'home',
                templateUrl: 'app/main/home.html',
                data: {
                    pageTitle: 'Example view'
                }
            });
    }]);