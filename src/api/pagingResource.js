'use strict';
const wrap 		 = require('co-express');
const Collection = require('../collectionModel');

class PagingResource {

	get base() { return '/'; }

	constructor(router) {
		router.get('/:collection/page/:docs/:page', wrap(this.getPaged));
	}

	*getPaged(request, response) {
		Collection.collectionName = request.params.collection;
		const body = request.body || {};
		const params = request.params;
		let query = Collection
			.skip(parseInt(params.docs)*(parseInt(params.page)-1))
			.limit(parseInt(params.docs))
			.where(body.data);
			
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
}
module.exports = PagingResource;