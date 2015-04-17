'use strict';

var mongoose = require('mongoose');
var async = require('async');
var _ = require('lodash');

var LookupSetupPlugin = function(schema) {
    // schema.pre('save',function(next) { this.wasNew = this.isNew; next(); })
    schema.pre('save',
        function addOrganizationLookups(addOrganizationLookupsTaskDone) {

        	var orgDoc = this;
            // if (this.wasNew) {
            // 	if (!_.isObject(orgDoc)) { return; }
            // 	if (!_.isString(orgDoc.orgCode)) { return; }
            var Lookup = mongoose.model('Lookup');
            Lookup
                .find({
                    specific: true,
                    org: null
                }) // Find org specific entries where org is null (global)
                .lean() // We want simple JSON objects back
                .exec(function(err, lookupDocs) {
                    if (err) {
                        console.log('ERROR: Error loading and creating org specific lookups: ', err);
                          addOrganizationLookupsTaskDone(err);
                    } else {
                        async.each(lookupDocs, function saveLookupDoc(lookupDoc, saveLookupDocIteratorTaskDone) {
                            lookupDoc.org = orgDoc._id;
                            // Remove attributes that will be automatically added on the new object through mongoose and middleware plugins
                            // delete(lookupDoc._id);
                            // delete(lookupDoc.acl);
                            // delete(lookupDoc.__v);
                            var newLookupObj = _.omit(lookupDoc, ['_id', 'acl', '_v']);
                            var newLookup = new Lookup(newLookupObj);
                            newLookup.save(function(saveErr) {
                                if (saveErr) {
                                    console.log('Error Creating Organization Specific Lookup', lookupDoc, saveErr);
                                    saveLookupDocIteratorTaskDone(saveErr);
                                    // saveLookupDocIteratorTaskDone();
                                } else {
                                    console.log('Successfully created Organization Specific Lookup.  Organization: ', orgDoc.name, ', Lookup: ', lookupDoc.name);
                                    saveLookupDocIteratorTaskDone();
                                }
                            });
                        }, function(err) {

                        		if (err) {
	                        		console.log('ERROR: Error loading and creating org specific lookups: ', err);
	                            addOrganizationLookupsTaskDone(err);
                        		}
                            console.log('Successfully created Organization Specific Lookups.  Organization: ', orgDoc.name);
                            addOrganizationLookupsTaskDone();

                        });

                    }
                });
            // }
        }
    );

    schema.pre('remove', function removeLookups(removeLookupsTaskDone) {
    		
    		var orgDoc = this;
        console.log('Removing Organization Specific Lookups for org ::%s', orgDoc.name, orgDoc._id);

        if (!orgDoc._id) {
        	return removeLookupsTaskDone();
        }

        var Lookup = mongoose.model('Lookup');
        Lookup.remove({
            specific: true,
            org: orgDoc._id
        }, function(removeErr) {
            if (removeErr) {
                console.log('Error Removing Organization Specific Lookups', removeErr);
                removeLookupsTaskDone(removeErr);
            }
            removeLookupsTaskDone();
        });

    });
};

module.exports = LookupSetupPlugin;