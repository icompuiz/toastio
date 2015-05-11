var mongoose = require('mongoose'),
    extend = require('mongoose-schema-extend'),
    jade = require('jade');

var components = require('../../components');

var BlockSchema = components.model.schema.extend({
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

BlockSchema.methods.compile = function(data) {

	if (this.text) {
		var template = jade.compile(this.text);
		var html = template(data);
		return html;
	} else {
		return '';
	}

};

module.exports = mongoose.model('Block', BlockSchema);