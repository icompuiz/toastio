'use strict';
var components = require('../../components');

exports.attach = function(TemplateResource) {
  components.requestinterceptor.interceptDelete(TemplateResource, TemplateResource);
  components.nesting.nestableController(TemplateResource, TemplateResource);
};