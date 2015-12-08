'use strict';
const Model = require('./core/database').Model;

class Collection extends Model {
	
	static set collectionName(value) {
		this.collection = value;
	}
}

module.exports = Collection;