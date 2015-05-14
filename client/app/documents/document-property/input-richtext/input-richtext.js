angular.module('toastio').directive('inputRichtext', ['$compile',
    function($compile) {
        return {

            restrict: 'A',
            scope: {
                documentProperty: '='
            },
            controller: ['$scope', function($scope) {
            	$scope.editorOptions = {
            		skin: 'moono',
            		contentEditable: true
            	};
            }],
            templateUrl: 'app/documents/document-property/input-richtext/input-richtext.html'

        }
    }
]);
