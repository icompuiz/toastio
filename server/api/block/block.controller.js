'use strict';
var components = require('../../components');

exports.attach = function(BlockResource) {
  components.nesting.nestableController(BlockResource, BlockResource);
  components.requestinterceptor.interceptDelete(BlockResource, BlockResource);
};