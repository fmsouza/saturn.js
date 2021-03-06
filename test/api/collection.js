'use strict';
/* global describe, it, before, after, global, __dirname; */

const testConfig = `${__dirname}/../test-config.json`;

const base = `${__dirname}/../../src`;
const Assert    = require('assert');
const Core      = require(`${base}/core`);
const Config	= require(`${base}/config`);
const Database  = Core.Database;
const Model		= Database.Model;
const Http	    = Core.Http;
const Router    = Core.Router;
const File      = Core.File;

var router;

describe('API HTTP Collection', () => {
	
	let server, host, savedObj;
	
	before(function*() {
        let config = JSON.parse((new File(testConfig)).read());
		const serverConfig = config['api-configuration'];
		const dbConfig = config['db-configuration'];
		host = `http://${serverConfig.host}:${serverConfig.port}`;
		
		global.db = yield Database.connect(dbConfig);
		let router = new Router(config);
		server = router.start(serverConfig.host, serverConfig.port);
	});
	
	it('should insert a new document in the collection \'tests\' by doing a POST request to \'/tests\' with the data', function*() {
		let obj = { foo: 'bar' };
		let data;
		try {
			var output = yield Http.post(`${host}/tests`, obj);
			data = output;
		} catch(e) {
			data = e;
		} finally {
			Assert.equal(data.statusCode, 200, data.toString());
			Assert.equal(data.body instanceof Object, true);
			Assert.equal(data.body.foo, obj.foo);
			savedObj = data.body;
		}
	});
	
	it('should insert a new document in the collection \'tests\' by sending a form in a POST request to \'/tests\' with the data', function*() {
		let obj = { foo: 'barfoo' };
		let data;
		try {
			var output = yield Http.postForm(`${host}/tests`, obj);
			data = JSON.parse(output);
		} catch(e) {
			data = e;
		} finally {
			Assert.equal(data.foo, obj.foo, data.toString());
		}
	});
	
	it('should update a document in the collection \'tests\' by doing a PUT request to \'/tests\' with the data including the \'_id\' in the body and the updated value to an existing field', function*() {
		let obj = JSON.parse(JSON.stringify(savedObj));
		obj.foo = 'bubble';
		let data, check;
		try {
			var output = yield Http.put(`${host}/tests`, obj);
			check = yield Http.get(`${host}/tests?query=${JSON.stringify(obj)}`);
			data = output;
		} catch(e) {
			data = e;
		} finally {
			Assert.equal(data.statusCode, 200, data.toString());
			Assert.equal(data.body, 'success');
			Assert.equal(check.statusCode, 200, data.toString());
			Assert.equal(check.body.length, 1);
			Assert.equal(check.body[0].foo, obj.foo);
		}
	});
	
	it('should update a document in the collection \'tests\' by doing a PUT request to \'/tests\' with the data including the \'_id\' in the body and the updated value to an unexisting field', function*() {
		let obj = JSON.parse(JSON.stringify(savedObj));
		obj.bar = 'foo';
		let data, check;
		try {
			var output = yield Http.put(`${host}/tests`, obj);
			check = yield Http.get(`${host}/tests?query=${JSON.stringify(obj)}`);
			data = output;
		} catch(e) {
			data = e;
		} finally {
			Assert.equal(data.statusCode, 200, data.toString());
			Assert.equal(data.body, 'success');
			Assert.equal(check.statusCode, 200, data.toString());
			Assert.equal(check.body.length, 1);
			Assert.equal(check.body[0].bar, obj.bar);
		}
	});
	
	it('should get the documents which match to the given query on the collection \'tests\' by doing a GET request to \'/tests\' with the data to query in the body', function*() {
		let data, obj = { _id: savedObj._id, foo: savedObj.foo };
		try {
			var output = yield Http.get(`${host}/tests?query=${JSON.stringify(obj)}`);
			data = output;
		} catch(e) {
			data = e;
		} finally {
			Assert.equal(data.statusCode, 200, data.toString());
            Assert.equal(data.body instanceof Array, true);
            Assert.equal(data.body.length, 1);
			Assert.equal(data.body[0].foo, 'bar');
		}
	});
	
	it('should get a list with all documents on the collection \'tests\' by doing a GET request to \'/tests\'', function*() {
		let data;
		try {
			var output = yield Http.get(`${host}/tests`);
			data = output;
		} catch(e) {
			data = e;
		} finally {
			Assert.equal(data.statusCode, 200, data.toString());
			Assert.equal(data.body instanceof Array, true);
			Assert.equal(data.body.length, 2);
			Assert.equal(data.body[0].foo, 'bar');
		}
	});
	
	it('should redirect to \'/tests\' API when making a request to \'/redirect\'', function*() {
		let data;
		try {
			var output = yield Http.get(`${host}/redirect`);
			data = output;
		} catch(e) {
			data = e;
		} finally {
			Assert.equal(data.statusCode, 200, data.toString());
			Assert.equal(data.body instanceof Array, true);
			Assert.equal(data.body.length, 2);
			Assert.equal(data.body[0].foo, 'bar');
		}
	});
	
	it('should get a list with all documents on the collection \'tests\', ordered by the field \'foo\', by doing a GET request to \'/tests\'', function*() {
		let data;
		const body = { foo: 1 };
		try {
			var output = yield Http.get(`${host}/tests?sort=${JSON.stringify(body)}`);
			data = output;
		} catch(e) {
			data = e;
		} finally {
			Assert.equal(data.statusCode, 200, data.toString());
			Assert.equal(data.body instanceof Array, true);
			Assert.equal(data.body.length, 2);
			Assert.equal(data.body[0].foo, 'bar');
		}
	});
	
	it('should delete a document in the collection \'tests\' by doing a DELETE request to \'/tests\' with the data to query for the document in the body', function*() {
		let data;
		try {
			var output = yield Http.delete(`${host}/tests?query=${JSON.stringify(savedObj)}`);
			data = output.statusCode;
		} catch(e) {
			data = e.statusCode;
		} finally {
			Assert.equal(data, 200, data.toString());
		}
	});
	
	it('should fail get the documents on the collection \'foo\' by doing a GET request because \'/foo\' the method is not publicly allowed', function*() {
		let data;
		try {
			var output = yield Http.get(`${host}/foo?query=${JSON.stringify(savedObj)}`);
			data = output.statusCode;
		} catch(e) {
			data = e.statusCode;
		} finally {
			Assert.equal(data, 400, data.toString());
		}
	});
	
	it('should fail to insert a new document in the collection \'foo\' by doing a POST request to \'/foo\' because the method is not allowed', function*() {
		let obj = { foo: 'bar' };
		let data;
		try {
			var output = yield Http.post(`${host}/foo`, obj);
			data = output.statusCode;
		} catch(e) {
			data = e.statusCode;
		} finally {
			Assert.equal(data, 400, data.toString());
		}
	});
    
    it('should save documents to the collection \'validating\' by doing a POST request respecting the validation requirements', function*() {
        let data, obj = { textField: 'foo', numberField: 100, dateField: new Date(), booleanField: true };
		try {
			var output = yield Http.post(`${host}/validating`, obj);
			data = output;
		} catch(e) {
			data = e;
		} finally {
			Assert.equal(data.statusCode, 200, data.toString());
            Assert.equal(data.body instanceof Object, true);
            Assert.deepEqual(data.body.textField, obj.textField);
            Assert.equal(typeof data.body.textField, 'string');
            Assert.deepEqual(data.body.numberField, obj.numberField);
            Assert.equal(typeof data.body.numberField, 'number');
            Assert.deepEqual(data.body.dateField, obj.dateField.toISOString());
            Assert.equal(new Date(data.body.dateField) instanceof Date, true);
            Assert.deepEqual(data.body.booleanField, obj.booleanField);
            Assert.equal(typeof data.body.booleanField, 'boolean');
		}
    });
    
    it('should fail to save documents to the collection \'validating\' by doing a POST request disrespecting the validation requirements', function*() {
        let data, obj = { textField: 'foo', numberField: 'wrong value', dateField: new Date(), booleanField: true };
		try {
			var output = yield Http.post(`${host}/validating`, obj);
			data = output;
		} catch(e) {
			data = e;
		} finally {
			Assert.equal(data.statusCode, 500, data.toString());
		}
    });
    
    it('should fail to save documents to the collection \'validating\' by doing a POST request missing a required field', function*() {
        let data, obj = { textField: 'foo', numberField: 100 };
		try {
			var output = yield Http.post(`${host}/validating`, obj);
			data = output;
		} catch(e) {
			data = e;
		} finally {
			Assert.equal(data.statusCode, 500, data.toString());
		}
    });
	
	after(function*() {
		server.close();
		yield global.db.collection('tests').remove({});
		yield global.db.collection('foo').remove({});
		yield global.db.collection('validating').remove({});
	});
});