angular.module('toastio').directive('inputText', ['$compile',
    function($compile) {
        return {

            restrict: 'A',
            scope: {
                documentProperty: '='
            },
            templateUrl: 'app/documents/document-property/input-text/input-text.html'

        }
    }
]);
