'use strict';

var passport = require('passport');
var mongoose = require('mongoose');
//var BadRequestError = require('passport-local').BadRequestError;

var components = require('../../components');
var commands = components.commands;

var login = function(user, req, res) {
    req.logIn(user, function() {
        console.log('auth.login req.logIn cb entry');

        console.log('Current user', user.username);

        req.user = user;

        var cookieOptions = {
            maxAge: 1000 * 60 * 60 * 24 * 7
        };

        if (req.body.rememberme) {
            res.cookie('username', '"' + user.username + '"', cookieOptions);
        }

        res.cookie('rememberme', req.body.rememberme, cookieOptions);

        commands.whoami(req, res);

    });

};

module.exports = {
    register: function(req, res, next) {
        var User = mongoose.model('User');
        try {
            User.validate(req.body);
        } catch (err) {
            return res.send(400, err.message);
        }

        var password = req.body.password; // Copy password as we pass this seprately so it can be hashed

        User.register(new User(req.body), password, function(err, user) {
            if (err) {
                console.log('Auth.register ERROR:');
                console.log(err);
                return res.send(400, err);
            }

            login(user, req, res, next);
        });
    },

    login: function(req, res, next) {
        
        console.log('auth.login ENTRY', req.session.cookie);
        passport.authenticate('local', function(err, user) {
            // console.log('auth.login passport.auth cb user:', user);

            if (err) {
                console.log('auth.login: failed: ', err);
                return next(err);
            }
            if (!user) {
                console.log('auth.login: No User Object');
                return res.send(401, 'Unauthorized: Bad username or password');
            }

            login(user, req, res, next);

        })(req, res, next);
    },

    logout: function(req, res) {
        var User = mongoose.model('User');

        console.log('auth.logout entry');
        req.logout();

        req.user = null;

        User.findOne({
            username: 'public'
        }, function(err, user) {

            if (err) {
                console.log('logout: Unexpected Error:', err);
                return res.send(500, 'Unexpected authorization error');
            }

            if (!user) {
                console.log('logout: Public user not found:', err);
                return res.send(500, 'Unexpected authorization error');
            }
            req.user = user;

            commands.whoami(req, res);
        });

    }

};
