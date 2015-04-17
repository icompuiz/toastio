'use strict';

angular.module('toastio')
  .factory('aclstring', function() {

    function AclString(baseString) {
      baseString = baseString || '';

      function toACLDefinition() {
        var urlParts = baseString.split('/');

        var index = 1;
        var corrected = _.map(urlParts, function(part) {

          if (part.match(/^:.*/)) {
            var param = ':param' + index;
            index++;
            return param;
          } else {
            return part;
          }

        });

        return corrected.join('/');
      }

      this.toACLDefinition = toACLDefinition;
    }

    function removeQuery(path) {
      return path.replace(/\?.*$/, '');
    }

    // Public API here
    return {
      create: function(baseString) {
        return new AclString(baseString);
      },
      removeQuery: removeQuery
    };
  });
