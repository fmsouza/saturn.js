'use strict';
const wrap = require('co-express');
const ServerDriver = require('express');
const PagingResource = require('./pagingResource');
const GenericDAO   = require('../dao/genericDAO');

class CollectionResource {

	get base() { return '/:collection'; }

	constructor(router) {
		router.get(this.base, wrap(this.getFromCollection));
		router.post(this.base, wrap(this.postToCollection));
		router.put(this.base, wrap(this.putToCollection));
		router.delete(this.base, wrap(this.deleteFromCollection));
		// let driver = new ServerDriver();
		// new PagingResource(driver);
		// router.use(this.base, driver);
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
			console.log(e);
			response.status(500).jsonp(e);
		}
	}

	*postToCollection(request, response) {
		const dao = new GenericDAO(request.params.collection);
		try {
			const data = yield dao.save(request.body);
			response.status(200).jsonp(data);
		} catch (e) {
			response.status(500).jsonp(e);
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
			response.status(500).jsonp(e);
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
			response.status(500).jsonp(e);
		}
	}
}
module.exports = CollectionResource;