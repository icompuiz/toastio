'use strict';

angular.module('toastio')
    .controller('VariablesCtrl', function($scope, $state, $stateParams, Restangular, PopupSvc) {

        var _loadSettings = angular.noop;

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

            _.forEach($scope.settings, function(setting, index) {

                if (setting._id) {
                    setting.alias = setting.name.toLowerCase().replace(/\W/, '_');
                    setting.put().then(function(result) {
                        $scope.settings[index] = result;
                    });
                } else {
                    var namevalComposite = (setting.name + setting.value).replace(/\s/g, '');
                    if (!_.isEmpty(namevalComposite)) {
                        setting.alias = setting.name.toLowerCase().replace(/\W/, '_');
                        Restangular.all('settings').post(setting).then(function(result) {
                            $scope.settings[index] = result;
                        });
                    }
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
