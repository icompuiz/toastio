'use strict';

var proxyquire = require('proxyquire').noPreserveCache();

var authenticationCtrlStub = {
  index: 'authenticationCtrl.index',
  show: 'authenticationCtrl.show',
  create: 'authenticationCtrl.create',
  update: 'authenticationCtrl.update',
  destroy: 'authenticationCtrl.destroy'
};

var routerStub = {
  get: sinon.spy(),
  put: sinon.spy(),
  patch: sinon.spy(),
  post: sinon.spy(),
  delete: sinon.spy()
};

// require the index with our stubbed out modules
var authenticationIndex = proxyquire('./index.js', {
  'express': {
    Router: function() {
      return routerStub;
    }
  },
  './authentication.controller': authenticationCtrlStub
});

describe('Authentication API Router:', function() {

  it('should return an express router instance', function() {
    authenticationIndex.should.equal(routerStub);
  });

  describe('GET /api/auth', function() {

    it('should route to authentication.controller.index', function() {
      routerStub.get
                .withArgs('/', 'authenticationCtrl.index')
                .should.have.been.calledOnce;
    });

  });

  describe('GET /api/auth/:id', function() {

    it('should route to authentication.controller.show', function() {
      routerStub.get
                .withArgs('/:id', 'authenticationCtrl.show')
                .should.have.been.calledOnce;
    });

  });

  describe('POST /api/auth', function() {

    it('should route to authentication.controller.create', function() {
      routerStub.post
                .withArgs('/', 'authenticationCtrl.create')
                .should.have.been.calledOnce;
    });

  });

  describe('PUT /api/auth/:id', function() {

    it('should route to authentication.controller.update', function() {
      routerStub.put
                .withArgs('/:id', 'authenticationCtrl.update')
                .should.have.been.calledOnce;
    });

  });

  describe('PATCH /api/auth/:id', function() {

    it('should route to authentication.controller.update', function() {
      routerStub.patch
                .withArgs('/:id', 'authenticationCtrl.update')
                .should.have.been.calledOnce;
    });

  });

  describe('DELETE /api/auth/:id', function() {

    it('should route to authentication.controller.destroy', function() {
      routerStub.delete
                .withArgs('/:id', 'authenticationCtrl.destroy')
                .should.have.been.calledOnce;
    });

  });

});
