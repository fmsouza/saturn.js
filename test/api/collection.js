'use strict';
/* global describe, it, before, __dirname; */

const base = `${__dirname}/../../src`;
const Assert    = require('assert');
const Core      = require(`${base}/core`);
const Config	= require(`${base}/config`);
const Database  = Core.Database;
const Http	    = Core.Http;
const Router    = Core.Router;

var router;

describe('API HTTP Collection', () => {
	
	let server, host;
	
	before(function*() {
		const serverConfig = Config.server;
		host = `http://${serverConfig.ip}:${serverConfig.port}`;
		
		global.database = yield Database.connect();
		
		let router = new Router();
		router.registerResources(Config.resources);
		server = router.start(serverConfig.ip, serverConfig.port);
	});
	
	it('should insert a new document in the collection \'test\' by doing a POST request to \'/test\' with the data', function*() {
		let obj = { foo: 'bar' };
		let data;
		try {
			var output = yield Http.post(`${host}/test`, obj);
			data = output.body;
		} catch(e) {
			data = e;
		} finally {
			Assert.equal(data instanceof Object, true);
			Assert.equal(data.foo, obj.foo);
		}
	});
	
	it('should get a list with all documents on the collection \'test\' by doing a GET request to \'/test\'', function*() {
		let data;
		try {
			var output = yield Http.get(`${host}/test`);
			data = output.body;
		} catch(e) {
			data = e;
		} finally {
			Assert.equal(data instanceof Array, true);
			Assert.equal(data.length, 1);
			Assert.equal(data[0].foo, 'bar');
		}
	});
	
	after(function*() {
		server.close();
		yield global.database.collection('test').remove({});
	});
});