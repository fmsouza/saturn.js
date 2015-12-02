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
		return (!data._id)? this.collection.insert(data) : this.collection.update({ _id: data._id }, data);
	}
	
	remove(data) {
		return this.collection.remove(data);
	}
}
module.exports = GenericDAO;