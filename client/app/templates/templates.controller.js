'use strict';

angular.module('toastio')
    .controller('TemplatesCtrl', function($scope, $state, $stateParams, Restangular, PopupSvc) {

        var _loadTemplate = angular.noop;

        function onTemplateLoaded(templateDoc) {

            $scope.formdata = templateDoc;

            templateDoc.one('tree').get().then(function(treeStack) {

                treeStack = treeStack.plain();

                treeStack.splice(0, 1);

                $scope.treeStack = treeStack.reverse();

            });

        }

        function onTemplateNotLoaded() {}

        function onTopLevelTemplatesLoaded(topLevelTemplates) {

            $scope.formdata.children = topLevelTemplates.plain();

        }

        function onTopLevelTemplatesNotLoaded() {

        }


        function loadTemplate(templateid, onSuccess, onError) {
            onSuccess = onSuccess || angular.noop;
            onError = onError || angular.noop;
            var query = Restangular.one('templates', templateid).get({
                populate: ['children', 'parent']
            });
            query.then(onSuccess, onError);
            return query;
        }

        $scope.delete = function(template) {

            PopupSvc.confirm('Are you sure? This action is irreversible.').then(function(confirmed) {

                if (confirmed) {
                    Restangular
                        .one('templates', template._id)
                        .remove()
                        .then(function() {
                            _loadTemplate();
                        });
                }

            });

        };


        if ($stateParams.templateid) {
            _loadTemplate = loadTemplate.bind(this, $stateParams.templateid, onTemplateLoaded, onTemplateNotLoaded);
            _loadTemplate();
        } else {
            _loadTemplate = loadTemplate.bind(this, null, onTopLevelTemplatesLoaded, onTopLevelTemplatesNotLoaded);
            _loadTemplate();
        }


        // ------------------------------------------------------------*/ scope

        $scope.formdata = {
            children: []
        };


    })
    .controller('TemplatesEditCtrl', function($scope, $state, $timeout, $stateParams, $log, Restangular) {

        var _loadTemplate = angular.noop;

        function onTemplateLoaded(templateDoc) {

            $scope.formdata = templateDoc;

            templateDoc.one('tree').get().then(function(treeStack) {

                treeStack = treeStack.plain();

                treeStack.splice(0, 1);

                $scope.treeStack = treeStack.reverse();

            });

        }

        function onParentTemplateLoaded(parentTemplateDoc) {

            $scope.formdata.parent = parentTemplateDoc._id;
            $scope.parent = parentTemplateDoc;

            parentTemplateDoc.one('tree').get().then(function(treeStack) {

                treeStack = treeStack.plain();

                $scope.treeStack = treeStack.reverse();

            });

        }

        function onParentTemplateNotLoaded() {}

        function onTemplateNotLoaded() {}

        function loadTemplate(templateid, onSuccess, onError) {
            onSuccess = onSuccess || angular.noop;
            onError = onError || angular.noop;
            var query = Restangular.one('templates', templateid).get({
                populate: ['children', 'parent']
            });
            query.then(onSuccess, onError);
            return query;
        }

        $scope.formdata = {};

        $scope.alias = '';

        var saveBtnText = 'Save';
        $scope.saveBtnText = saveBtnText;
        $scope.saveState = 'ready';

        $scope.editorOptions = {
            lineNumbers: true,
            styleActiveLine: true,
            theme: 'ambiance',
            indentWithTabs: true,
            mode: 'htmlmixed'
        };

        $scope.submit = function() {

            if ($scope.formdata.alias) {
                $scope.formdata.alias.trim();
            }

            $scope.saveBtnText = 'Submitting...';
            $scope.saveState = 'waiting';

            if ($scope.formdata._id) {

                var formdata = $scope.formdata.clone();

                formdata.children = _.pluck(formdata.children, '_id');
                if (formdata.parent) {
                    formdata.parent = formdata.parent._id;
                }

                var putRequest = formdata.put();

                putRequest.then(function() {

                    $scope.saveState = 'success';
                    $scope.saveBtnText = 'Success!';

                    $timeout(function() {
                        $scope.saveState = 'ready';
                        $scope.saveBtnText = saveBtnText;
                    }, 500);

                }, function() {

                    $scope.saveState = 'failed';
                    $scope.saveBtnText = 'See below for error details.';

                    $timeout(function() {
                        $scope.saveState = 'ready';
                        $scope.saveBtnText = saveBtnText;
                    }, 2000);

                });

                return putRequest;

            } else {

                var postRequest = Restangular.all('templates').post($scope.formdata);
                postRequest.then(function(postResult) {
                    $log.debug(postResult);
                    $scope.formdata = postResult;

                    $state.go('templates.list', {
                        templateid: $scope.formdata._id
                    });

                }, function(error) {
                    $log.error(error);

                    $scope.saveState = 'failed';
                    $scope.saveBtnText = 'See below for error details.';

                    $timeout(function() {
                        $scope.saveState = 'ready';
                        $scope.saveBtnText = saveBtnText;
                    }, 2000);
                    
                });

                return postRequest;
            }

        };

        $scope.delete = function() {

            $scope.formdata.remove().then(function() {

                $state.go('templates.list', {
                    templateid: $scope.formdata.templateid
                });

            });


        };

        $scope.cancel = function() {

            $state.go('templates.list', {
                templateid: $stateParams.parentid || $stateParams.templateid
            });

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

        if ($stateParams.templateid) {
            _loadTemplate = loadTemplate.bind(this, $stateParams.templateid, onTemplateLoaded, onTemplateNotLoaded);
            _loadTemplate();
        } else if ($stateParams.parentid) {
            $scope.formdata = {};
            _loadTemplate = loadTemplate.bind(this, $stateParams.parentid, onParentTemplateLoaded, onParentTemplateNotLoaded);
            _loadTemplate();
        }

    });
