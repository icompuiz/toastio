angular.module('toastio')
    .directive('documentPropertyInput', ['$compile',
        function($compile) {
            return {

                restrict: 'E',
                scope: {
                    documentProperty: '='
                },
                link: function($scope, tElement, tAttributes) {

                    var documentPropertyInputWrapper = angular.element('<div data-document-property="documentProperty" />');
                    documentPropertyInputWrapper.attr($scope.documentProperty.format, true);
                    var childScope = $scope.$new();

                    childScope.documentProperty = $scope.documentProperty;
                    tElement.append(documentPropertyInputWrapper);

                    $compile(documentPropertyInputWrapper)(childScope);

                }

            }
        }
    ]);
