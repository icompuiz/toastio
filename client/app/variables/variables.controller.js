/* global async: true */

'use strict';

angular.module('toastio')
    .controller('VariablesCtrl', function($scope, $state, $timeout, $stateParams, Restangular, PopupSvc) {

        var _loadSettings = angular.noop;

        var saveBtnText = 'Save';
        $scope.saveBtnText = saveBtnText;
        $scope.saveState = 'ready';


        function onSettingLoaded(settings) {

            $scope.settings = settings;

        }

        function onSettingNotLoaded() {}

        function loadSettings(variableid, onSuccess, onError) {
            onSuccess = onSuccess || angular.noop;
            onError = onError || angular.noop;
            var query = Restangular.all('settings').getList();
            query.then(onSuccess, onError);
            return query;
        }

        $scope.addSetting = function() {

            var setting = {
                key: '',
                value: ''
            };

            $scope.settings.push(setting);

        };
        $scope.delete = function($index) {

            function splice() {
                $scope.settings.splice($index, 1);
            }

            PopupSvc.confirm('Are you sure? This action is irreversible.').then(function(confirmed) {
                if (confirmed) {
                    var setting = $scope.settings[$index];

                    if (setting._id) {
                        Restangular
                            .one('settings', setting._id)
                            .remove()
                            .then(function() {
                                splice();
                            });
                    }

                } else {
                    splice();
                }

            });

        };

        $scope.submit = function() {

            var saveBtnText = 'Save';
            $scope.saveBtnText = saveBtnText;
            $scope.saveState = 'ready';

            async.map($scope.settings, function(setting, interateCb) {

                if (setting._id) {
                    setting.alias = setting.name.toLowerCase().replace(/\W/, '_');
                    setting.put().then(function(result) {
                        
                        interateCb(null, result);

                    }, interateCb);
                } else {
                    var namevalComposite = (setting.name + setting.value).replace(/\s/g, '');
                    if (!_.isEmpty(namevalComposite)) {
                        setting.alias = setting.name.toLowerCase().replace(/\W/, '_');
                        Restangular.all('settings').post(setting).then(function(result) {
                            
                            interateCb(null, result);

                        }, interateCb);
                    }
                }

            }, function(err, settings) {

                if (err) {

                    $scope.saveState = 'failed';
                    $scope.saveBtnText = 'See below for error details.';

                    $timeout(function() {
                        $scope.saveState = 'ready';
                        $scope.saveBtnText = saveBtnText;
                    }, 2000);

                } else {

                    $scope.settings = settings;

                    $scope.saveState = 'success';
                    $scope.saveBtnText = 'Success!';

                    $timeout(function() {
                        $scope.saveState = 'ready';
                        $scope.saveBtnText = saveBtnText;
                    }, 500);
                }


            });

        };



        // ------------------------------------------------------------*/ scope

        $scope.formdata = {};

        _loadSettings = loadSettings.bind(this, $stateParams.variableid, onSettingLoaded, onSettingNotLoaded);
        _loadSettings();

    }).filter('varableAlias', function() {
        return function(input) {

            var out = (input || '').toLowerCase().replace(/\W/, '_');

            return out;
        };
    });
