/**
 * Main application routes
 */

'use strict';

module.exports = {
	// Insert components below
	model: require('./model'),
	accessControl:  require('./accessControl'),
	route: require('./route'),
	commands: require('./commands'),
	sorting: require('./sorting'),
	directory: require('./directory'),
	requestinterceptor: require('./requestinterceptor'),
	nesting: require('./nesting'),
	modelUtils: require('./modelutils'),
	apiUtils: require('./apiUtils'),
	group: require('./group'),
	statusService: require('./status.service'),
	errors: require('./errors')
};