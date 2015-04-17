'use strict';

var app = require('../../app');
var request = require('supertest');

var newAuthentication;

describe('Authentication API:', function() {

  describe('GET /api/auth', function() {
    var authentications;

    beforeEach(function(done) {
      request(app)
        .get('/api/auth')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          authentications = res.body;
          done();
        });
    });

    it('should respond with JSON array', function() {
      authentications.should.be.instanceOf(Array);
    });

  });

  describe('POST /api/auth', function() {
    beforeEach(function(done) {
      request(app)
        .post('/api/auth')
        .send({
          name: 'New Authentication',
          info: 'This is the brand new authentication!!!'
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          newAuthentication = res.body;
          done();
        });
    });

    it('should respond with the newly created authentication', function() {
      newAuthentication.name.should.equal('New Authentication');
      newAuthentication.info.should.equal('This is the brand new authentication!!!');
    });

  });

  describe('GET /api/auth/:id', function() {
    var authentication;

    beforeEach(function(done) {
      request(app)
        .get('/api/auth/' + newAuthentication._id)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          authentication = res.body;
          done();
        });
    });

    afterEach(function() {
      authentication = {};
    });

    it('should respond with the requested authentication', function() {
      authentication.name.should.equal('New Authentication');
      authentication.info.should.equal('This is the brand new authentication!!!');
    });

  });

  describe('PUT /api/auth/:id', function() {
    var updatedAuthentication

    beforeEach(function(done) {
      request(app)
        .put('/api/auth/' + newAuthentication._id)
        .send({
          name: 'Updated Authentication',
          info: 'This is the updated authentication!!!'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          updatedAuthentication = res.body;
          done();
        });
    });

    afterEach(function() {
      updatedAuthentication = {};
    });

    it('should respond with the updated authentication', function() {
      updatedAuthentication.name.should.equal('Updated Authentication');
      updatedAuthentication.info.should.equal('This is the updated authentication!!!');
    });

  });

  describe('DELETE /api/auth/:id', function() {

    it('should respond with 204 on successful removal', function(done) {
      request(app)
        .delete('/api/auth/' + newAuthentication._id)
        .expect(204)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should respond with 404 when authentication does not exsist', function(done) {
      request(app)
        .delete('/api/auth/' + newAuthentication._id)
        .expect(404)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          done();
        });
    });

  });

});
