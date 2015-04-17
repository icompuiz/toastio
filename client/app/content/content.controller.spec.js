'use strict';

describe('Controller: ContentCtrl', function () {

  // load the controller's module
  beforeEach(module('toastio'));

  var ContentCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    ContentCtrl = $controller('ContentCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
