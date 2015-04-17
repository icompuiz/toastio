'use strict';

describe('Controller: DocumentsCtrl', function () {

  // load the controller's module
  beforeEach(module('toastio'));

  var DocumentsCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    DocumentsCtrl = $controller('DocumentsCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
