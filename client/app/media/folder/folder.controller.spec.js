'use strict';

describe('Controller: FolderCtrl', function () {

  // load the controller's module
  beforeEach(module('toastio'));

  var FolderCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    FolderCtrl = $controller('FolderCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
