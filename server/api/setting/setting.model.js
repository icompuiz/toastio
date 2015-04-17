'use strict';

var mongoose = require('mongoose'),
    _ = require('lodash');

require('mongoose-schema-extend');

var components = require('../../components');

var SettingSchema = components.model.schema.extend({
    name: {
        type: String,
        default: '',
        trim: true,
        required: true
    },
    alias: {
        type: String,
        default: '',
        trim: true,
        required: true
    },
    value: {
        type: String,
        default: '',
        trim: true,
        required: true
    }
});

SettingSchema.pre('save', function(done) {
        var doc = this;

        if (_.isEmpty(doc.alias)) {
            doc.alias = doc.name.toLowerCase().replace(/\W/, '_');
        } else {
            doc.alias = doc.alias.toLowerCase().replace(/\W/, '_');
        }

        done();
    });

module.exports = mongoose.model('Setting', SettingSchema);