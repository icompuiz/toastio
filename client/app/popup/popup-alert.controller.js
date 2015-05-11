'use strict';

angular.module('toastio').controller('PopupAlertCtrl', [
    '$scope', '$modalInstance', 'popupConfig',
    function($scope, $modalInstance, popupConfig) {
        $scope.popup = popupConfig;
        $scope.close = function() {
            $modalInstance.close();
        };
    }
]);
