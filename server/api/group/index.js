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

var Group = require('./group.model');
var GroupController = require('./group.controller');

var GroupResource = restful
                .model(Group.modelName,Group.schema)
                .methods(['get','put','delete','post']);         

GroupController.attach(GroupResource);

module.exports = {
	resource:  GroupResource,
	controller: GroupController,
	model: Group
};