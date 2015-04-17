'use strict';

var mongoose = require('mongoose'),
    DocumentProperty = require('../document_property/document_property.model');

var components = require('../../components');

require('mongoose-schema-extend');

var DocumentSchema = components.model.schema.extend({
    name: {
        type: String,
        default: '',
        trim: true,
        required: true
    },
    type: {
        ref: 'Type',
        type: mongoose.Schema.Types.ObjectId
    },
    properties: [DocumentProperty.schema]
});



DocumentSchema.plugin(components.nesting.nestableModel, 'Document');

module.exports = mongoose.model('Document', DocumentSchema);