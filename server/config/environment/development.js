'use strict';

// Development specific configuration
// ==================================
module.exports = {
  // MongoDB connection options
  mongo: {
    uri: 'mongodb://localhost/5m-ifendu',

    sessionuri: 'mongodb://localhost/5m-ifendu-session'

    // uri: 'mongodb://localhost/toastio-dev',
    // sessionuri: 'mongodb://localhost/toastio-dev-session'
  },

  seedDB: true,
  port: 8080
  // port: 9001
};
