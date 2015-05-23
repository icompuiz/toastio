function makeid(len) {
	len = len || 5;
	var text = '';
	var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

	for (var i = 0; i < len; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;

}

module.exports.root = {
	username: 'root',
	password: makeid(19),
	fullName: 'root',
	system: true,
	organization: null,
	comments: null,
	address: {
		addr1: null,
		addr2: null,
		city: null,
		stateProv: null,
		postalCode: null,
		country: null
	}
};

module.exports.public = {
	username: 'public',
	password: makeid(19),
	groups: ['public'],
	fullName: 'public',
	system: true,
	organization: null,
	comments: null,
	address: {
		addr1: null,
		addr2: null,
		city: null,
		stateProv: null,
		postalCode: null,
		country: null
	}
};

module.exports.all = [{
	username: 'isioma.nnodum@gmail.com',
	groups: ['administrators'],
	password: 'isioma',
	fullName: 'Isioma Nnodum',
	organization: null,
	comments: null,
	address: {
		addr1: null,
		addr2: null,
		city: null,
		stateProv: null,
		postalCode: null,
		country: null
	}
}];
