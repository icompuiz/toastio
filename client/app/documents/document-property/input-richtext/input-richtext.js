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
            		contentEditable: true,
                    extraAllowedContent: 'hr'

            	};
            }],
            templateUrl: 'app/documents/document-property/input-richtext/input-richtext.html'

        }
    }
]);
