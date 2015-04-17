var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	accessControl = require('../accessControl');

var ModelSchema = new Schema({
	created: {
		type: Date,
		default: Date.now
	},
    system: {
        type: Boolean,
        default: false
    },
	modified: {
		type: Date,
		default: Date.now
	}
});

ModelSchema.pre('save', function(done) {
	this.modified = Date.now();
	done();
});

ModelSchema.pre('remove', function(done) {

    if (this.system) {
        done(new Error('System items cannot be deleted'));
    } else {
        done();
    }

});

ModelSchema.plugin(accessControl);

module.exports = mongoose.model('Model', ModelSchema);