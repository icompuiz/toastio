'use strict';


// =========================================
// By default this pattern registers
//
// GET /resources
// GET /resources/:id
// POST /resources
// PUT /resources/:id
// DELETE /resources/:id
//
// Where /resources = the base URL that is passed by the .register() function.

var restful = require('node-restful');

var Setting = require('./setting.model');
var SettingController = require('./setting.controller');

var SettingResource = restful
                .model('Setting',Setting.schema)
                .methods(['get','put','delete','post']);         

SettingController.attach(SettingResource);

module.exports = {
	resource:  SettingResource,
	controller: SettingController,
	model: Setting
};