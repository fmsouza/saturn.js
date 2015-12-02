'use strict';
const wrap = require('co-express');
const ServerDriver = require('express');
const CollectionResource = require('./collectionResource');

class MainResource {

	get base() { return '/'; }

	constructor(router) {
		let session = new ServerDriver();
		new CollectionResource(session);
		router.use(this.base, session);
	}
}
module.exports = MainResource;