angular.module('toastio').directive('inputJade', ['$compile',
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
                    mode: 'jade'
                };
            }],
            templateUrl: 'app/documents/document-property/input-jade/input-jade.html'

        }
    }
]);
