'use strict';

angular.module('toastio')
    .directive('hkCtrlS', function($hotkey) {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {

                $hotkey.bind('Ctrl + S', function($event) {
                    var invokeFn = scope.$eval(attrs.hkCtrlS);
                    if (_.isFunction(invokeFn)) {
                        $event.preventDefault();
                        invokeFn.call();
                    }
                });

            }
        };
    });
