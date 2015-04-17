'use strict';
var components = require('../../components');

exports.attach = function(DocumentResource) {

	components.apiUtils.addPermissionChecks(DocumentResource, DocumentResource);
  components.requestinterceptor.interceptDelete(DocumentResource, DocumentResource);
  components.nesting.nestableController(DocumentResource, DocumentResource);

};