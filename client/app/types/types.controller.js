'use strict';

angular.module('toastio')
    .controller('TypesCtrl', function($scope, $state, $stateParams, Restangular, PopupSvc) {

        var _loadType = angular.noop;

        function onTypeLoaded(typeDoc) {

            $scope.formdata = typeDoc;

            typeDoc.one('tree').get().then(function(treeStack) {

                treeStack = treeStack.plain();

                treeStack.splice(0, 1);

                $scope.treeStack = treeStack.reverse();

            });

        }

        function onTypeNotLoaded() {}

        function onTopLevelTypesLoaded(topLevelTypes) {

            $scope.formdata.children = topLevelTypes.plain();

        }

        function onTopLevelTypesNotLoaded() {

        }


        function loadType(typeid, onSuccess, onError) {
            onSuccess = onSuccess || angular.noop;
            onError = onError || angular.noop;
            var query = Restangular.one('types', typeid).get({
                populate: ['children', 'parent']
            });
            query.then(onSuccess, onError);
            return query;
        }

        $scope.delete = function(type) {

            PopupSvc.confirm('Are you sure? This action is irreversible.').then(function(confirmed) {

                if (confirmed) {
                    Restangular
                        .one('types', type._id)
                        .remove()
                        .then(function() {
                            _loadType();
                        });
                }

            });

        };

        if ($stateParams.typeid) {
            _loadType = loadType.bind(this, $stateParams.typeid, onTypeLoaded, onTypeNotLoaded);
            _loadType();
        } else {
            _loadType = loadType.bind(this, null, onTopLevelTypesLoaded, onTopLevelTypesNotLoaded);
            _loadType();
        }


        // ------------------------------------------------------------*/ scope

        $scope.formdata = {
            children: []
        };


    })
    .controller('TypesEditCtrl', function($scope, $state, $stateParams, $log, Restangular) {

        var _loadType = angular.noop;

        function onTypeLoaded(typeDoc) {

            $scope.formdata = typeDoc;

            typeDoc.one('tree').get().then(function(treeStack) {

                treeStack = treeStack.plain();

                treeStack.splice(0, 1);

                $scope.treeStack = treeStack.reverse();

            });

            Restangular.all('templates').getList({
                pass: 'true'
            }).then(function(templateDocs) {
                $scope.templates = templateDocs;
            });

        }

        function onParentTypeLoaded(parentTypeDoc) {

            $scope.formdata.parent = parentTypeDoc._id;
            $scope.parent = parentTypeDoc;

            parentTypeDoc.one('tree').get().then(function(treeStack) {

                treeStack = treeStack.plain();

                $scope.treeStack = treeStack.reverse();

            });

        }

        function onParentTypeNotLoaded() {}

        function onTypeNotLoaded() {}

        function loadType(typeid, onSuccess, onError) {
            onSuccess = onSuccess || angular.noop;
            onError = onError || angular.noop;
            var query = Restangular.one('types', typeid).get({
                populate: ['children', 'parent']
            });
            query.then(onSuccess, onError);
            return query;
        }

        $scope.formdata = {};

        $scope.alias = '';

        $scope.submit = function() {

            if ($scope.formdata.alias) {
                $scope.formdata.alias.trim();
            }

            if ($scope.formdata._id) {

                var formdata = $scope.formdata.clone();

                formdata.children = _.pluck(formdata.children, '_id');
                if (formdata.parent) {
                    formdata.parent = formdata.parent._id;
                }


                var putRequest = formdata.put();

                return putRequest;

            } else {

                var postRequest = Restangular.all('types').post($scope.formdata);
                postRequest.then(function(postResult) {
                    $log.debug(postResult);
                    $scope.formdata = postResult;

                    $state.go('types.list', {
                        typeid: $scope.formdata._id
                    });

                }, function(error) {
                    $log.error(error);
                });

                return postRequest;
            }

        };

        $scope.delete = function() {

            $scope.formdata.remove().then(function() {

                $state.go('types.list', {
                    typeid: $scope.formdata.typeid
                });

            });


        };

        $scope.cancel = function() {

            $state.go('types.list', {
                typeid: $stateParams.parentid || $stateParams.typeid
            });

        };

        $scope.addProperty = function() {

            if (!_.isArray($scope.formdata.properties)) {
                $scope.formdata.properties = [];
            }

            var property = {
                name: '',
                format: 'text'
            };

            $scope.formdata.properties.push(property);

        };

        $scope.removeProperty = function(index) {

            if (_.isArray($scope.formdata.properties)) {

                $scope.formdata.properties.splice(index, 1);

            }

        };

        var stopWatchingName = $scope.$watch('formdata.name', function(newValue) {
            if (!_.isEmpty(newValue)) {
                $scope.formdata.alias = newValue.toLowerCase().replace(/\W/, '_');
            }
        });

        $scope.$watch('formdata.alias', function(newValue) {
            if (!_.isEmpty(newValue)) {
                $scope.formdata.alias = newValue.replace(/\W/, '_');
            }
        });

        if ($stateParams.typeid) {
            _loadType = loadType.bind(this, $stateParams.typeid, onTypeLoaded, onTypeNotLoaded);
            _loadType();
        } else if ($stateParams.parentid) {
            $scope.formdata = {};
            _loadType = loadType.bind(this, $stateParams.parentid, onParentTypeLoaded, onParentTypeNotLoaded);
            _loadType();
        }

    });
