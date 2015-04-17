'use strict';
var components = require('../../components');

exports.attach = function(DocumentPropertyResource) {

	components.apiUtils.addPermissionChecks(DocumentPropertyResource, DocumentPropertyResource);
  components.requestinterceptor.interceptDelete(DocumentPropertyResource, DocumentPropertyResource);
  components.nesting.nestableController(DocumentPropertyResource, DocumentPropertyResource);
  
};