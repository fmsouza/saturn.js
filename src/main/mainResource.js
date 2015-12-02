'use strict';
const wrap = require('co-express');

class MainResource {

	get base() { return '/main'; }

	constructor(router) {
		router.get('/', this.getMainRoute);
		router.get('/generator', wrap(this.getAlternativeRoute));
	}

	getMainRoute(request, response) {
		response.jsonp({ type: 'success', message: 'hello world!' });
	}

	*getAlternativeRoute(request, response) {
		response.jsonp({ type: 'success', message: 'hello generators!' });
	}
}
module.exports = MainResource;