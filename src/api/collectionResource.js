'use strict';
const wrap = require('co-express');
const Database = require('../core/database');
const Collection = require('../collectionModel');

class CollectionResource {

	get base() { return '/'; }

	constructor(router) {
		router.get('/:collection', wrap(this.getFromCollection));
		router.post('/:collection', wrap(this.postToCollection));
		router.put('/:collection', wrap(this.putToCollection));
		router.delete('/:collection', wrap(this.deleteFromCollection));
	}

	*getFromCollection(request, response) {
		Collection.collectionName = request.params.collection;
		const body = request.body || {};
		let query = Collection.where(body.data);
		
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

	*postToCollection(request, response) {
		Collection.collectionName = request.params.collection;
		try {
			let obj = new Collection(request.body);
			yield obj.save();
			response.status(200).jsonp(obj);
		} catch (e) {
			response.status(500).jsonp(e.toString());
		}
	}

	*putToCollection(request, response) {
		Collection.collectionName = request.params.collection;
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

	*deleteFromCollection(request, response) {
		Collection.collectionName = request.params.collection;
		const body = request.body;
		try {
			yield Collection.remove(body);
			response.status(200).send('success');
		} catch (e) {
			response.status(500).jsonp(e.toString());
		}
	}
}
module.exports = CollectionResource;