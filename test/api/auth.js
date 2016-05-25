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
		
		global.db = yield Database.connect(dbConfig);
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
            Assert.equal(data.body.roles.indexOf('user')>-1, true, 'New user must have \'user\' role.');
            Assert.notEqual(data.body.roles.indexOf('admin')>-1, true, 'New user must not be admin.');
		}
	});
	
	it('should fail to create a new user with an existing email', function*() {
		let user = { email: email, password: '654321' };
		let data;
		try {
			var output = yield Http.post(`${host}/signup`, user);
			data = output;
		} catch(e) {
			data = e;
		} finally {
			Assert.equal(data.statusCode, 500);
		}
	});
	
	it('should create another user', function*() {
		let user = { email: email+'222', password: '123456' };
		let data;
		try {
			var output = yield Http.postForm(`${host}/signup`, user);
			data = JSON.parse(output);
		} catch(e) {
			data = e;
		} finally {
            Assert.equal(data instanceof Error, false);
            Assert.equal(data.email, email+'222');
            Assert.equal(data.roles.indexOf('user')>-1, true, 'New user must have \'user\' role.');
            Assert.notEqual(data.roles.indexOf('admin')>-1, true, 'New user must not be admin.');
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
	
	it('should update user password', function*() {
		let pass = { currentPassword: '123456', newPassword: '1234567' };
		let data;
		try {
			var output = yield Http.put(`${host}/update-password`, pass, { 'Authorization': token });
			data = output;
		} catch(e) {
			data = e;
		} finally {
			Assert.equal(data.statusCode, 200, JSON.stringify(data.error));
		}
	});
	
	it('should fail to update user password without authorization', function*() {
		let pass = { currentPassword: '123456', newPassword: '1234567' };
		let data;
		try {
			var output = yield Http.put(`${host}/update-password`, pass);
			data = output;
		} catch(e) {
			data = e;
		} finally {
			Assert.equal(data.statusCode, 500, JSON.stringify(data.error));
		}
	});
	
	it('should send an e-mail with instructions to recover user password', function*() {
		let mail = { email: email };
		let data;
		try {
			var output = yield Http.post(`${host}/recover-password`, mail);
			data = output;
		} catch(e) {
			data = e;
		} finally {
			Assert.equal(data.statusCode, 200, JSON.stringify(data.error));
		}
	});
    
    it('should allow the user to access the private API using the authorization key', function*() {
        let data;
		try {
			var output = yield Http.get(`${host}/foo`, { 'Authorization': token });
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
			var output = yield Http.get(`${host}/users`, { 'Authorization': token });
			data = output;
		} catch(e) {
			data = e;
		} finally {
			Assert.equal(data.statusCode, 400, 'User should not be allowed here.');
		}
    });
    
    it('should not allow the user to access role update API using the authorization key when not an admin', function*() {
        let data, config = { email: email, roles: ['user', 'admin', 'role3'] };
		try {
			var output = yield Http.put(`${host}/update-roles`, { 'Authorization': token });
			data = output;
		} catch(e) {
			data = e;
		} finally {
			Assert.equal(data.statusCode, 400);
		}
    });
	
	after(function*() {
		yield global.db.collection('users').remove({});
		server.close();
	});
});