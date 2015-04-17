'use strict';

var mongoose = require('mongoose'),
    extend = require('mongoose-schema-extend'),
    TypeProperty = require('../type_property/type_property.model');

var components = require('../../components');

var TypeSchema = components.model.schema.extend({
    name: {
        type: String,
        default: '',
        trim: true,
        required: true
    },
    template: {
        ref: 'Template',
        type: mongoose.Schema.Types.ObjectId
    },
    properties: [TypeProperty.schema]
});

TypeSchema.plugin(components.nesting.nestableModel, 'Type');

module.exports = mongoose.model('Type', TypeSchema);