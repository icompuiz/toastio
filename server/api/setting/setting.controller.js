'use strict';
var components = require('../../components');

exports.attach = function(SettingResource) {

    components.apiUtils.addPermissionChecks(SettingResource, SettingResource);
    components.requestinterceptor.interceptDelete(SettingResource, SettingResource);

    SettingResource.before('put', function(req, res, next) {

        if (req.body.alias) {
            req.body.alias = req.body.alias.replace(/\W/, '_');
        }

        next();

    });



};
