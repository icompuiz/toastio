angular.module('toastio').directive('inputRichtext', ['$compile',
    function($compile) {
        return {

            restrict: 'A',
            scope: {
                documentProperty: '='
            },
            templateUrl: 'app/documents/document-property/input-richtext/input-richtext.html'

        }
    }
]);
