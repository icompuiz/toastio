'use strict';

describe('Controller: BlocksCtrl', function () {

  // load the controller's module
  beforeEach(module('toastio'));

  var BlocksCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    BlocksCtrl = $controller('BlocksCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
