'use strict';
const wrap = require('co-express');
const GenericDAO   = require('../dao/genericDAO');

class CollectionResource {

	get base() { return '/'; }

	constructor(router) {
		router.get('/:collection', wrap(this.getFromCollection));
		router.post('/:collection', wrap(this.postToCollection));
		router.put('/:collection', wrap(this.putToCollection));
		router.delete('/:collection', wrap(this.deleteFromCollection));
	}

	*getFromCollection(request, response) {
		const dao = new GenericDAO(request.params.collection);
		const body = request.body || {};
		const options = { sort: { _id: 1 } };
		if(body.sort) options.sort = body.sort;
		let data = [];
		
		try {
			data = yield dao.find(body.data, options);
			response.status(200).jsonp(data);
		} catch (e) {
			response.status(500).jsonp(e.toString());
		}
	}

	*postToCollection(request, response) {
		const dao = new GenericDAO(request.params.collection);
		try {
			const data = yield dao.save(request.body);
			response.status(200).jsonp(data);
		} catch (e) {
			response.status(500).jsonp(e.toString());
		}
	}

	*putToCollection(request, response) {
		const params = request.params;
		const dao = new GenericDAO(params.collection);
		const body = request.body;
		try {
			yield dao.save(body);
			response.status(200).send('success');
		} catch (e) {
			response.status(500).jsonp(e.toString());
		}
	}

	*deleteFromCollection(request, response) {
		const params = request.params;
		const dao = new GenericDAO(params.collection);
		const body = request.body;
		try {
			yield dao.remove(body);
			response.status(200).send('success');
		} catch (e) {
			response.status(500).jsonp(e.toString());
		}
	}
}
module.exports = CollectionResource;