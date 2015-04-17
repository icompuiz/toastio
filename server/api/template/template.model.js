'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
    
var components = require('../../components');

var TemplateSchema = new Schema({
    name: {
        type: String,
        default: '',
        trim: true,
        required: true
    },
    text: {
        type: String,
        default: ''
    }
});

TemplateSchema.plugin(components.nesting.nestableModel, 'Template');

module.exports = mongoose.model('Template', TemplateSchema);