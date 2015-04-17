'use strict';
var components = require('../../components');

exports.attach = function(ScriptResource) {
  components.requestinterceptor.interceptDelete(ScriptResource, ScriptResource);
  components.nesting.nestableController(ScriptResource, ScriptResource);
};