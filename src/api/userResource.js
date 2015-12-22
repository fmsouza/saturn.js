'use strict';
const Core = require('../core');
const Database = Core.Database;
const Collection = require('../collectionModel');

class UserResource {
    
    constructor(userConfig) {
        this.config = userConfig;
		Collection.prototype.collection = this.config.collection;
    }

	*signup(request, response) {
        const body = request.body;
		try {
			let obj = new Collection(body);
			yield obj.save();
            obj.unset('password');
			response.status(200).jsonp(obj);
		} catch (e) {
			response.status(500).jsonp(e.toString());
		}
	}
}
module.exports = UserResource;