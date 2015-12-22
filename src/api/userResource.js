'use strict';
const Core = require('../core');
const Database = Core.Database;
const Collection = require('../collectionModel');

class UserResource {
    
    constructor(userConfig) {
        this.config = userConfig;
		Collection.prototype.collection = this.config.collection;
    }

	*signin(request, response) {
        const body = request.body;
		try {
			let obj = new Collection(body);
			yield obj.save();
			response.status(200).jsonp(obj);
		} catch (e) {
			response.status(500).jsonp(e.toString());
		}
	}
}
module.exports = UserResource;