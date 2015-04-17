'use strict';

describe('Service: aclstring', function () {

  // load the service's module
  beforeEach(module('pivconpmpmgmtGuiApp'));

  // instantiate service
  var aclstring;
  beforeEach(inject(function (_aclstring_) {
    aclstring = _aclstring_;
  }));

  it('should do something', function () {
    expect(!!aclstring).toBe(true);
  });

});
