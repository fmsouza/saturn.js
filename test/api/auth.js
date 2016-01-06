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

var router, token;

describe('Authentication API', () => {
	
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
            Assert.equal(data.body.roles[0], 'user');
		}
	});
	
	it('should login with the created used data', function*() {
		let user = { email: email, password: '123456' };
		let data;
		try {
			var output = yield Http.post(`${host}/signin`, user);
			data = output;
		} catch(e) {
			data = e;
		} finally {
			Assert.equal(data.statusCode, 200);
            Assert.notEqual(data.body, null);
            token = data.body;
		}
	});
    
    it('should allow the user to access the private API using the authorization key', function*() {
        let data;
		try {
			var output = yield Http.get(`${host}/foo`, {}, { 'Authorization': token });
			data = output;
		} catch(e) {
			data = e;
		} finally {
			Assert.equal(data.statusCode, 200);
            Assert.equal(data.body.length, 0);
		}
    });
    
    it('should not allow the user to access the private API using the authorization key when having no required roles', function*() {
        let data;
		try {
			var output = yield Http.get(`${host}/users`, {}, { 'Authorization': token });
			data = output;
		} catch(e) {
			data = e;
		} finally {
			Assert.equal(data.statusCode, 400);
		}
    });
	
	after(() => { server.close(); });
});