/**
 * Main application routes
 */

'use strict';
var _ = require('lodash');
var path = require('path');

var components = require('./components');
var errors = require('./components').errors;

module.exports = function(app) {
  function addRestfulEndpoint(endpoint, path) {
    // attach ACL controls and other common middleware
    console.log('Register Node Restful Route: ' + path);
    if (_.isFunction(endpoint.register)) {
      endpoint.register(app, path);
    } else if (!_.isEmpty(endpoint.resource) && _.isFunction(endpoint.resource.register)) {
      endpoint.resource.register.call(endpoint.resource, app, path);
    }
  }

  function addEndpoint(endpoint) {

    if (_.isEmpty(endpoint.routes)) {
      console.log('No routes defined for endpoint');
      return;
    }

    _.forEach(endpoint.routes, function(route) {
      // attach ACL controls and other common middleware
      console.log('Register Express Route: ' + route.path);

      var aclOn = false;
      if (_.isArray(route.middleware)) {
        aclOn = true;
      } else {
        var middleware = [route.middleware];
        route.middleware = middleware;
      }

      var args = _.flatten([route.path, route.middleware]);
      if (route.params) {
        _.each(route.params, function(param, key) {
          app.param(key, param);

        });
      }

      switch (route.method.toUpperCase()) {
        case 'GET':
          app.get.apply(app, args);
          break;
        case 'POST':
          app.post.apply(app, args);
          break;
        case 'PUT':
          app.put.apply(app, args);
          break;
        case 'DELETE':
          app.delete.apply(app, args);
          break;
        default:
          throw new Error('Invalid HTTP method specified for route ' + route.path);
      }
    });
  }

  app.use(components.commands.setGlobalUser);
  // app.use(components.route.checkRoute);
  app.use(components.commands.addCookies);

  // Order is important because different endpoints may register particular dependencies 
  // Insert routes below
  addRestfulEndpoint(require('./api/setting'), '/api/settings');
  addRestfulEndpoint(require('./api/script'), '/api/scripts');
  addRestfulEndpoint(require('./api/block'), '/api/blocks');
  addRestfulEndpoint(require('./api/template'), '/api/templates');
  addRestfulEndpoint(require('./api/type_property'), '/api/type_properties');
  addRestfulEndpoint(require('./api/type'), '/api/types');
  addRestfulEndpoint(require('./api/document_property'), '/api/document_properties');
  addRestfulEndpoint(require('./api/document'), '/api/documents');
  addRestfulEndpoint(require('./api/filesystem.file'), '/api/files');
  addRestfulEndpoint(require('./api/filesystem.directory'), '/api/directories');
  addRestfulEndpoint(require('./api/filesystem'), '/api/fileSystem');
  addRestfulEndpoint(require('./api/group'), '/api/groups');
  addRestfulEndpoint(require('./api/user'), '/api/users');
  
  addEndpoint(require('./api/authentication'));

  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)/*')
    .get(errors[404]);

  // All other routes should redirect to the index.html
  app.route('/toastio')
    .get(function(req, res) {
      console.log("Entering CMS");
      res.sendFile(path.resolve(app.get('appPath') + '/toastio.html'));
    });
  app.route('/toastio/*')
    .get(function(req, res) {
      console.log("Entering CMS");
      res.sendFile(path.resolve(app.get('appPath') + '/toastio.html'));
    });

  addEndpoint(require('./api/content'));
};