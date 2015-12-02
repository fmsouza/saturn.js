'use strict';
const wrap = require('co-express');
const ServerDriver = require('express');
const SortResource = require('./sortResource');
const GenericDAO   = require('../dao/genericDAO');

class CollectionResource {

	get base() { return '/:collection'; }

	constructor(router) {
		router.get('/:collection', wrap(this.getFromCollection));
		router.post('/:collection', wrap(this.postToCollection));
		router.put('/:collection', wrap(this.putToCollection));
		router.delete('/:collection', wrap(this.deleteFromCollection));
		// let driver = new ServerDriver();
		// let resource = new SortResource(driver);
		// router.use(resource.base, driver);
	}

	*getFromCollection(request, response) {
		const dao = new GenericDAO(request.params.collection);
		let data = [];
		try {
			data = yield dao.getAll();
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