'use strict';
const Core = require('../core');
const Common = require('../common');
const Collection = require('../collectionModel');
const Database = Core.Database;
const FieldValidator = Common.FieldValidator;

/**
 * GenericResource class is responsible for handling all CRUD operations, data validation and interaction with the repository.
 * @class {GenericResource}
 */
class GenericResource {

    /**
     * Retrieves information from the repository
     * @param {Object} request - HTTP request object data
     * @param {Object} response - HTTP response object data
     * @return {void}
     */
	*GET(request, response, policy) {
        const params = request.url.split('/');
		Collection.prototype.collection = params[1];
		const body = request.body;
        if(policy.hasOwnProperty('fields')) {
            const validator = new FieldValidator(policy.fields);
            body.data = validator.validate(body, false);
        }
        
        let query = Collection;
		if(body.sort) {
			let sort = Object.keys(body.sort)[0];
			query = query.sort(sort, body.sort[sort]);
            delete body.sort;
		}
        query = query.where(body);
        if(params.length===5 && params[2]==='page' && !isNaN(params[3]) && !isNaN(params[4])) {
            let docs = parseInt(params[3]);
            let skipped = docs*(parseInt(params[4])-1);
            query = query.skip(skipped).limit(docs);
        }
        
		try {
			let data = yield query.find();
			response.status(200).jsonp(data);
		} catch (e) {
			response.status(500).jsonp(e.toString());
		}
	}

    /**
     * Saves information to the repository
     * @param {Object} request - HTTP request object data
     * @param {Object} response - HTTP response object data
     * @return {void}
     */
	*POST(request, response, policy) {
        const params = request.url.split('/');
		Collection.prototype.collection = params[1];
        let body = request.body || {};
        if(request.hasOwnProperty('files')) {
            let files = request.files || [];
            for (let index in files) {
                body[files[index].fieldname] = files[index];
            }
        }
        
		try {
            if(policy.hasOwnProperty('fields')) {
                const validator = new FieldValidator(policy.fields);
                body = validator.validate(body, true);
            }
            
			let obj = new Collection(body);
			yield obj.save();
			response.status(200).jsonp(obj);
		} catch (e) {
			response.status(500).jsonp(e.toString());
		}
	}

    /**
     * Updates information in the repository
     * @param {Object} request - HTTP request object data
     * @param {Object} response - HTTP response object data
     * @return {void}
     */
	*PUT(request, response, policy) {
        const params = request.url.split('/');
		Collection.prototype.collection = params[1];
        let body = request.body || {};
        if(request.hasOwnProperty('files')) {
            let files = request.files || [];
            for (let index in files) {
                body[files[index].fieldname] = files[index];
            }
        }
        
		let obj = yield Collection.findById(body._id);
		for (let key of Object.keys(body)) obj.set(key, body[key]);
		try {
			yield obj.save();
			response.status(200).send('success');
		} catch (e) {
			response.status(500).jsonp(e.toString());
		}
	}

    /**
     * Removes information from the repository
     * @param {Object} request - HTTP request object data
     * @param {Object} response - HTTP response object data
     * @return {void}
     */
	*DELETE(request, response, policy) {
        const params = request.url.split('/');
		Collection.prototype.collection = params[1];
		const body = request.body;
        
		try {
			let obj = yield Collection.findOne(body);
            yield Collection.remove(obj);
			response.status(200).send('success');
		} catch (e) {
			response.status(500).jsonp(e.toString());
		}
	}
}
module.exports = GenericResource;