'use strict';

angular.module('toastio')
    .controller('DocumentsCtrl', function($scope, $log, $state, $stateParams, Restangular, PopupSvc) {

        var _loadDocument = angular.noop;

        function onDocumentLoaded(documentDoc) {

            if (!documentDoc) {
                return onDocumentNotLoaded();
            }

            $scope.formdata = documentDoc;

            documentDoc.one('tree').get().then(function(treeStack) {

                treeStack = treeStack.plain();

                treeStack.splice(0, 1);

                $scope.treeStack = treeStack.reverse();

                $scope.path = _.pluck($scope.treeStack, 'alias').concat([$scope.formdata.alias]).join('/');

            });

        }

        function onDocumentNotLoaded(err) {


            $log.debug('Error Loading Document', err);

            var stateParams = {
                documentid: null
            };
            $state.go('documents.list', stateParams);

        }

        function onTopLevelDocumentsLoaded(topLevelDocuments) {

            $scope.formdata.children = topLevelDocuments.plain();

        }

        function onTopLevelDocumentsNotLoaded() {

        }


        function loadDocument(documentid, onSuccess, onError) {
            onSuccess = onSuccess || angular.noop;
            onError = onError || angular.noop;
            var query = Restangular.one('documents', documentid).get({
                populate: ['children', 'parent']
            });
            query.then(onSuccess, onError);
            return query;
        }

        $scope.delete = function(doc) {

            PopupSvc.confirm('Are you sure? This action is irreversible.').then(function(confirmed) {

                if (confirmed) {
                    Restangular
                        .one('documents', doc._id)
                        .remove()
                        .then(function() {
                            _loadDocument();
                        });
                }

            });

        };

        if ($stateParams.documentid) {
            _loadDocument = loadDocument.bind(this, $stateParams.documentid, onDocumentLoaded, onDocumentNotLoaded);
            _loadDocument();
        } else {
            _loadDocument = loadDocument.bind(this, null, onTopLevelDocumentsLoaded, onTopLevelDocumentsNotLoaded);
            _loadDocument();

        }


        // ------------------------------------------------------------*/ scope

        $scope.formdata = {
            children: []
        };

        $scope.deleteDocument = function(formdata) {
            var removePromise = formdata.remove();

            removePromise.then(function() {
                var stateParams = {
                    documentid: null
                };

                if (formdata.parent && formdata.parent._id) {
                    stateParams.documentid = formdata.parent._id;
                }

                $state.go('documents.list', stateParams);

            });

            return removePromise;
        };


    })
    .controller('DocumentsEditCtrl', function($scope, $state, $stateParams, $log, Restangular) {

        var _loadDocument = angular.noop;

        function loadTypes() {

            Restangular.all('documents').getList({
                pass: true
            }).then(function(documentTypes) {

                $scope.types = documentTypes;

            });
        }

        function onDocumentLoaded(documentDoc) {

            $scope.formdata = documentDoc;

            documentDoc.one('tree').get().then(function(treeStack) {

                treeStack = treeStack.plain();

                treeStack.splice(0, 1);

                $scope.treeStack = treeStack.reverse();

                $scope.path = _.pluck($scope.treeStack, 'alias').join('/');

            });

            loadTypes();
        }

        function onParentDocumentLoaded(parentDocumentDoc) {

            $scope.formdata.parent = parentDocumentDoc._id;
            $scope.parent = parentDocumentDoc;

            parentDocumentDoc.one('tree').get().then(function(treeStack) {

                treeStack = treeStack.plain();

                $scope.treeStack = treeStack.reverse();

            });

            loadTypes();
            
        }

        function onParentDocumentNotLoaded() {}

        function onDocumentNotLoaded() {}

        function loadDocument(documentid, onSuccess, onError) {
            onSuccess = onSuccess || angular.noop;
            onError = onError || angular.noop;
            var query = Restangular.one('documents', documentid).get({
                populate: ['children', 'parent']
            });
            query.then(onSuccess, onError);
            return query;
        }

        function setProperties(types, typeId) {

            if (!(typeId && types)) {
                return;
            }

            $scope.documentType = _.find(types, {
                _id: typeId
            });

            if (!$scope.documentType) {
                return;
            }

            _($scope.documentType.properties).forEach(function(property) {

                var exists = _.find($scope.formdata.properties, {
                    name: property.name
                });

                if (!exists) {
                    property = _.clone(property);
                    delete property._id;
                    $scope.formdata.properties.push(property);
                }

            });

            $scope.formdata.properties = _($scope.formdata.properties).filter(function(property) {

                var exists = _.find($scope.documentType.properties, {
                    name: property.name
                });

                if (exists) {
                    return property;
                } else {
                    if (!_.isEmpty(property.value)) {
                        return property;
                    }
                }

            }).value();

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

                var postRequest = Restangular.all('documents').post($scope.formdata);
                postRequest.then(function(postResult) {
                    $log.debug(postResult);
                    $scope.formdata = postResult;

                    $state.go('documents.list', {
                        documentid: $scope.formdata._id
                    });

                }, function(error) {
                    $log.error(error);
                });

                return postRequest;
            }

        };

        $scope.delete = function() {

            $scope.formdata.remove().then(function() {

                $state.go('documents.list', {
                    documentid: $scope.formdata.documentid
                });

            });


        };

        $scope.cancel = function() {

            $state.go('documents.list', {
                documentid: $stateParams.parentid || $stateParams.documentid
            });

        };

        $scope.removeProperty = function($index) {
            $scope.formdata.properties[$index].value = null;
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


        $scope.$watch('formdata.type', function(typeId) {
            setProperties($scope.types, typeId);
        });
        $scope.$watch('types', function(types) {
            setProperties(types, $scope.formdata.type);
        });

        if ($stateParams.documentid) {
            _loadDocument = loadDocument.bind(this, $stateParams.documentid, onDocumentLoaded, onDocumentNotLoaded);
            _loadDocument();
        } else {
            $scope.formdata = {};
            _loadDocument = loadDocument.bind(this, $stateParams.parentid, onParentDocumentLoaded, onParentDocumentNotLoaded);
            _loadDocument();
        }

    });