'use strict';
const Core = require('../core');
const Database = Core.Database;
const Collection = require('../collectionModel');

class GenericResource {

	*GET(request, response) {
        const params = request.url.split('/');
		Collection.prototype.collection = params[1];
		const body = request.body || {};
		let query = Collection.where(body.data);
		console.log(`Retrieving from '${params[1]}' matching ${JSON.stringify(body || {})}`);
        
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

	*POST(request, response) {
        const params = request.url.split('/');
		Collection.prototype.collection = params[1];
        const body = request.body;
		console.log(`Saving to '${params[1]}' matching ${JSON.stringify(body || {})}`);
        
		try {
			let obj = new Collection(body);
			yield obj.save();
			response.status(200).jsonp(obj);
		} catch (e) {
			response.status(500).jsonp(e.toString());
		}
	}

	*PUT(request, response) {
        const params = request.url.split('/');
		Collection.prototype.collection = params[1];
		const body = request.body;
		console.log(`Updating in '${params[1]}' matching ${JSON.stringify(body || {})}`);
        
		let obj = yield Collection.findById(body._id);
		for (let key of Object.keys(body)) obj.set(key, body[key]);
		try {
			yield obj.save();
			response.status(200).send('success');
		} catch (e) {
			response.status(500).jsonp(e.toString());
		}
	}

	*DELETE(request, response) {
        const params = request.url.split('/');
		Collection.prototype.collection = params[1];
		const body = request.body;
		console.log(`Removing from '${params[1]}' matching ${JSON.stringify(body || {})}`);
        
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