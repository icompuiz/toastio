'use strict';

angular.module('toastio')
    .controller('SearchBarCtrl', function($scope, $state) {

        this.query = '';

        this.execute = function() {

            $state.go('search.results', { query: this.query });

        };

    })
    .controller('SearchCtrl', function($scope, $state, $stateParams, Restangular) {

        var _doSearch = angular.noop;

        function onSearchSuccess(results) {

            $scope.results = results;

        }

        function onSearchError() {}

        function doSearch(query, onSuccess, onError) {
            onSuccess = onSuccess || angular.noop;
            onError = onError || angular.noop;
            var request = Restangular.all('search').post({ 
                q: query
            });
            request.then(onSuccess, onError);
            return request;
        }

        // ------------------------------------------------------------*/ scope
        _doSearch = doSearch.bind(this, $stateParams.query, onSearchSuccess, onSearchError);
        _doSearch();



    });
