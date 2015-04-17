'use strict';
var components = require('../../components');
var mongoose = require('mongoose'),
	_ = require('lodash'),
	async = require('async'),
	Schema = mongoose.Schema;

// Schema

var entrySchema = new Schema({
	code: {
		type: String
	},
	descr: {
		type: String
	}
}, {
	_id: false
});

var LookupSchema = new Schema({
	specific: Boolean,
	org: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Org'
	},
	category: {
		type: String,
		required: true
	},
	name: {
		type: String,
		required: true
	},
	descr: String,
	entries: [entrySchema]
});

LookupSchema.plugin(components.accessControl, {
	inheritFrom: {
		model: 'Org',
		field: 'org'
	}
});


LookupSchema.statics.getLookups = function getLookups(org, callback) {

	var Lookup = this;

	function lookupsToMap(lookupMap, lookups) {
		_.forEach(lookups, function(lookup) {
			lookupMap[lookup.name] = {};

			_.forEach(lookup.entries, function(entry) {
				lookupMap[lookup.name][entry.code] = entry.descr;
			});
		});
	}

	function getSpecificLookups(org, lookupMap, fall) {

		Lookup.find({
			org: org._id || org,
			specific: true
		}).exec(function(err, lookups) {

			if (err) {
				return fall(err);
			}

			lookupsToMap(lookupMap, lookups);

			fall(null, lookupMap);

		});

	}

	function getGlobalLookups(fall) {

		Lookup.find({
			org: null,
			specific: false
		}).exec(function(err, lookups) {

			if (err) {
				return fall(err);
			}

			var lookupMap = {};

			lookupsToMap(lookupMap, lookups);

			fall(null, org, lookupMap);

		});

	}


	async.waterfall([getGlobalLookups, getSpecificLookups], callback);

};

module.exports = mongoose.model('Lookup', LookupSchema);
