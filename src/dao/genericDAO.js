'use strict';
/* global database; */

class GenericDAO {
	
	constructor(collectionName, connection) {
		if(!connection) connection = database;
		this.collection = connection.collection(collectionName);
	}
	
	getAll() {
		return this.collection.find({});
	}
	
	save(data) {
		return this.collection.insert(data);
	}
}
module.exports = GenericDAO;