/**
 * Express configuration
 */

'use strict';

var express = require('express');
var favicon = require('serve-favicon');
var morgan = require('morgan');
var compression = require('compression');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var errorHandler = require('errorhandler');
var compression = require('compression');
var session = require('express-session');
var passport = require('passport');
var path = require('path');
var config = require('./environment');
var multipart = require('connect-multiparty');

var MongoStore = require('connect-mongo')(session);


module.exports = function(app) {
  var env = app.get('env');

  app.set('views', config.root + '/server/views');
  app.set('view engine', 'jade');
  app.use(compression());

  app.use(bodyParser.raw());
  app.use(express.query());
  app.use(bodyParser.urlencoded({
    extended: false
  }));
  app.use(multipart());
  app.use(bodyParser.json());
  app.use(methodOverride());
  app.use(cookieParser(config.secrets.cookie));
  app.use(compression());

  app.set('appPath', path.join(config.root, 'client'));

  app.use(session({
    key: 'connect.toastyio.sid',
    store: new MongoStore({
      url: config.mongo.sessionuri
    }),
    secret: config.secrets.session,
    unset: 'destroy'
  }));

  if ('production' === env) {
    app.use(favicon(path.join(config.root, 'client', 'favicon.ico')));
    app.use(express.static(app.get('appPath')));
    app.use(morgan('dev'));
  }

  if ('development' === env || 'test' === env) {
    app.use(require('connect-livereload')());
    app.use(express.static(path.join(config.root, '.tmp')));
    app.use(express.static(app.get('appPath')));
    app.use(morgan('dev'));
    app.use(errorHandler()); // Error handler - has to be last
  }

  app.use(passport.initialize());
  app.use(passport.session()); // must be after express.session

  // Router needs to be last
  app.use(express.Router());

  var User = require('../api/user/user.model');

  // Configure Passport
  passport.use(User.createStrategy());
  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());

};
