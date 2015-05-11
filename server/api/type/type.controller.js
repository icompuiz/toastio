'use strict';
var components = require('../../components');

exports.attach = function(TypeResource) {

	components.apiUtils.addPermissionChecks(TypeResource, TypeResource);
  components.requestinterceptor.interceptPut(TypeResource, TypeResource);
  components.requestinterceptor.interceptDelete(TypeResource, TypeResource);
  components.nesting.nestableController(TypeResource, TypeResource);

};