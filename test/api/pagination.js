'use strict';
/* global describe, it, before, after, global, __dirname; */

const base = `${__dirname}/../../src`;
const Assert    = require('assert');
const Core      = require(`${base}/core`);
const Config	= require(`${base}/config`);
const Database  = Core.Database;
const Http	    = Core.Http;
const Router    = Core.Router;

var router;

describe('API HTTP Collection with Pagination', () => {
	
	let server, host, savedObj;
	
	before(function*() {
		const serverConfig = Config.server;
		host = `http://${serverConfig.ip}:${serverConfig.port}`;
		
		global.database = yield Database.connect();
		let insertion = [];
		for(let i = 0; i<10; i++) insertion.push({value: i});
		insertion = yield global.database.collection('test').insert(insertion);
		
		let router = new Router();
		router.registerResources(Config.resources);
		server = router.start(serverConfig.ip, serverConfig.port);
	});
	
	it('should get a block of 3 documents on the collection \'test\' by doing a GET request to \'/test/page/3/1\'', function*() {
		let data;
		try {
			var output = yield Http.get(`${host}/test/page/3/1`);
			data = output.body;
		} catch(e) {
			data = e;
		} finally {
			Assert.equal(data instanceof Array, true);
			Assert.equal(data.length, 3);
			Assert.equal(data[0].value, 0);
			Assert.equal(data[1].value, 1);
			Assert.equal(data[2].value, 2);
		}
	});
	
	it('should get a block of 5 documents on the collection \'test\' by doing a GET request to \'/test/page/5/2\'', function*() {
		let data;
		try {
			var output = yield Http.get(`${host}/test/page/5/2`);
			data = output.body;
		} catch(e) {
			data = e;
		} finally {
			Assert.equal(data instanceof Array, true);
			Assert.equal(data.length, 5);
			Assert.equal(data[0].value, 5);
			Assert.equal(data[1].value, 6);
			Assert.equal(data[2].value, 7);
			Assert.equal(data[3].value, 8);
			Assert.equal(data[4].value, 9);
		}
	});
	
	after(function*() {
		server.close();
		yield global.database.collection('test').remove({});
	});
});