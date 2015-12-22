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

describe('API HTTP Users', () => {
	
	let server, host, email = `${(new Date()).toISOString()}@user.com`, user;
	
	before(function*() {
        let config = JSON.parse((new File(testConfig)).read());
		const serverConfig = config['api-configuration'];
		const dbConfig = config['db-configuration'];
		host = `http://${serverConfig.host}:${serverConfig.port}`;
		
		yield Database.connect(dbConfig);
		let router = new Router(config);
		server = router.start(serverConfig.host, serverConfig.port);
	});
	
	it('should create a new user', function*() {
		let user = { email: email, password: '123456' };
		let data;
		try {
			var output = yield Http.post(`${host}/signup`, user);
			data = output;
		} catch(e) {
			data = e;
		} finally {
			Assert.equal(data.statusCode, 200);
            Assert.equal(data.body.email, email);
		}
	});
	
	after(() => { server.close(); });
});