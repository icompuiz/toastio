var async = require('async');
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

ModelSchema.pre('remove', function(done) {

    if (this.system) {
        done(new Error('System items cannot be deleted'));
    } else {
        done();
    }

});

ModelSchema.methods.onPut = function(req, res, onPutCb) {

	var task = function(afterTaskDb) {
		this.modified = Date.now();
        console.log('Modified::', this.modified)
		afterTaskDb();
	}.bind(req.body);

	var tasks = [task];

	async.auto(tasks, onPutCb);

};

ModelSchema.plugin(accessControl);

module.exports = mongoose.model('Model', ModelSchema);
