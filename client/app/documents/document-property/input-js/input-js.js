angular.module('toastio').directive('inputJs', ['$compile',
    function($compile) {
        return {
            restrict: 'A',
            scope: {
                documentProperty: '='
            },
            controller: ['$scope', function($scope) {
                $scope.editorOptions = {
                    lineNumbers: true,
                    matchBrackets: true,
                    styleActiveLine: true,
                    theme: 'ambiance',
                    indentWithTabs: true,
                    mode: 'javascript'
                };
            }],
            templateUrl: 'app/documents/document-property/input-js/input-js.html'

        };
    }
]);
