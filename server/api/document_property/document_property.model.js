'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var DocumentPropertySchema = new Schema({
    name: {
        type: String,
        default: '',
        trim: true,
        required: true
    },
    format: {
        type: String,
        default: 'plaintext'
    },
    value: {
        type: String,
        default: ''
    }
});

module.exports =  mongoose.model('DocumentProperty', DocumentPropertySchema);