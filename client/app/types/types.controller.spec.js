'use strict';

describe('Controller: TypesCtrl', function () {

  // load the controller's module
  beforeEach(module('toastio'));

  var TypesCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    TypesCtrl = $controller('TypesCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
