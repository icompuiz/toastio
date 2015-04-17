var stripcolor = require('stripcolorcodes');

var buildStatus = function(parentDescr, stepDescr, argDescr, err) {
	var reason = '';
	var str = parentDescr.yellow.bold + '::' + stepDescr.yellow.bold + '::' + argDescr.yellow.bold;
	if (err) {
		reason = '' + err + '';
		str = str + ' [' + 'ERROR'.red.bold + ', Reason:' + reason.red + ']';
	} else {
		str = str + ' [' + 'Success'.green + ']';
	}
	console.log(str);
	if (err) {
		return new Error(stripcolor(str))
	}
	return stripcolor(str);
};

module.exports = {
	buildStatus: buildStatus
};