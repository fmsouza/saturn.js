'use strict';
/* global describe, it, before, after, global, __dirname; */

const base = `${__dirname}/../../src`;
const Assert    = require('assert');
const Core      = require(`${base}/core`);
const Config	= require(`${base}/config`);
const Database  = Core.Database;
const Model		= Database.Model;
const Http	    = Core.Http;
const Router    = Core.Router;

var router;

class Test extends Model {
	get value() { return this.get('value'); }
	set value(value) { this.set('value', value); }
}

describe('API HTTP Collection with Pagination', () => {
	
	let server, host;
	
	before(function*() {
		const serverConfig = Config.server;
		host = `http://${serverConfig.ip}:${serverConfig.port}`;
		
		yield Database.connect();
		for(let i = 0; i<10; i++) yield (new Test({ value: i })).save();
		
		let router = new Router();
		router.registerResources(Config.resources);
		server = router.start(serverConfig.ip, serverConfig.port);
	});
	
	it('should get a block of 3 documents on the collection \'tests\' by doing a GET request to \'/tests/page/3/1\'', function*() {
		let data;
		try {
			var output = yield Http.get(`${host}/tests/page/3/1`);
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
	
	it('should get a block of 5 documents on the collection \'tests\' by doing a GET request to \'/tests/page/5/2\'', function*() {
		let data;
		try {
			var output = yield Http.get(`${host}/tests/page/5/2`);
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
		yield Test.remove({});
	});
});