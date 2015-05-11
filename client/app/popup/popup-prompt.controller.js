'use strict';

angular.module('toastio').controller('PopupPromptCtrl', [
    '$scope', '$modalInstance', 'popupConfig',
    function($scope, $modalInstance, popupConfig) {
        $scope.popup = popupConfig;
        $scope.accept = function() {
            $modalInstance.close(true);
        };
        $scope.reject = function() {
            $modalInstance.close(false);
        }
    }
]);
