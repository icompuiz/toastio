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

BlockSchema.methods.compile = function(data, callback) {

	if (this.text) {
		var template = jade.compile(this.text);
		var html = template(data);
		callback(null, html);
	} else {
		callback(null,'');
	}

};

module.exports = mongoose.model('Block', BlockSchema);