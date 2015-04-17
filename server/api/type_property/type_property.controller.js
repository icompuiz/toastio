'use strict';
var components = require('../../components');

exports.attach = function(TypePropertyResource) {

	components.apiUtils.addPermissionChecks(TypePropertyResource, TypePropertyResource);
  components.requestinterceptor.interceptDelete(TypePropertyResource, TypePropertyResource);
  components.nesting.nestableController(TypePropertyResource, TypePropertyResource);
};