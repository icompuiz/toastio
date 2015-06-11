'use strict';

describe('Directive: hkCtrlS', function () {

  // load the directive's module
  beforeEach(module('toastioApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<hk-ctrl-s></hk-ctrl-s>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the hkCtrlS directive');
  }));
});