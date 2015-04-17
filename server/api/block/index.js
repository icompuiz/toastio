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

var Block = require('./block.model');
var BlockController = require('./block.controller');

var BlockResource = restful
                .model('Block',Block.schema)
                .methods(['get','put','delete','post']);         

BlockController.attach(BlockResource);

module.exports = {
	resource:  BlockResource,
	controller: BlockController,
	model: Block
};