'use strict';
const wrap 		 = require('co-express');
const GenericDAO = require('../dao/genericDAO');

class PagingResource {

	get base() { return '/'; }

	constructor(router) {
		router.get('/:collection/page/:docs/:page', wrap(this.getPaged));
	}

	*getPaged(request, response) {
		const dao = new GenericDAO(request.params.collection);
		const body = request.body || {};
		const params = request.params;
		const options = {
			sort: { _id: 1 },
			skip: parseInt(params.docs)*(parseInt(params.page)-1),
			limit: parseInt(params.docs)
		};
		if(body.sort) options.sort = body.sort;
		let data = [];
		try {
			data = yield dao.find(body.data, options);
			response.status(200).jsonp(data);
		} catch (e) {
			response.status(500).jsonp(e.toString());
		}
	}
}
module.exports = PagingResource;