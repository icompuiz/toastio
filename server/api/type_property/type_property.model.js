'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TypePropertySchema = new Schema({
    name: {
        type: String,
        default: '',
        trim: true,
        required: true
    },
    format: {
        type: String,
        default: 'text'
    }
});

module.exports =  mongoose.model('TypeProperty', TypePropertySchema);