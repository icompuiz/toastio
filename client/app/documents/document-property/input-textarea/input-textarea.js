'use strict';

angular.module('toastio').directive('inputTextarea', ['$compile',
    function() {
        return {

            restrict: 'A',
            scope: {
                documentProperty: '='
            },
            templateUrl: 'app/documents/document-property/input-textarea/input-textarea.html'

        };
    }
]);
