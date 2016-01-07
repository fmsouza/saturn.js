'use strict';
const Core = require('../core');
const Database = Core.Database;
const Collection = require('../collectionModel');

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
	*GET(request, response) {
        const params = request.url.split('/');
		Collection.prototype.collection = params[1];
		const body = request.body || {};
        
		let query = Collection.where(body.data);
        if(params.length===5 && params[2]==='page' && !isNaN(params[3]) && !isNaN(params[4])) {
            let docs = parseInt(params[3]);
            let skipped = docs*(parseInt(params[4])-1);
            query = query.skip(skipped).limit(docs);
        }
        
		if(body.sort) {
			let sort = Object.keys(body.sort)[0];
			query = query.sort(sort, body.sort[sort]);
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
	*POST(request, response) {
        const params = request.url.split('/');
		Collection.prototype.collection = params[1];
        const body = request.body;
        
		try {
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
	*PUT(request, response) {
        const params = request.url.split('/');
		Collection.prototype.collection = params[1];
		const body = request.body;
        
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
	*DELETE(request, response) {
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