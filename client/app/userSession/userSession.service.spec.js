'use strict';

describe('Service: userSessionSvc', function () {

  // load the service's module
  beforeEach(module('toastio'));

  // instantiate service
  var userSessionSvc;
  beforeEach(inject(function (_userSessionSvc_) {
    userSessionSvc = _userSessionSvc_;
  }));

  it('should do something', function () {
    expect(!!userSessionSvc).toBe(true);
  });

});
