'use strict';

describe('Controller: FilesCtrl', function () {

  // load the controller's module
  beforeEach(module('toastio'));

  var FilesCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    FilesCtrl = $controller('FilesCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
