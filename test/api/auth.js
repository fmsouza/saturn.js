'use strict';
/* global describe, it, before, after, global, __dirname; */

const testConfig = `${__dirname}/../test-config.json`;

const base = `${__dirname}/../../src`;
const Assert    = require('assert');
const Core      = require(`${base}/core`);
const Config	= require(`${base}/config`);
const Common	= require(`${base}/common`);
const Security	= Common.Security;
const Database  = Core.Database;
const Model		= Database.Model;
const Http	    = Core.Http;
const Router    = Core.Router;
const File      = Core.File;

var router, token, admToken;

describe('Authentication API', () => {
	
	let server, host, email = `${(new Date()).toISOString()}@user.com`, user;
	
	before(function*() {
        let config = JSON.parse((new File(testConfig)).read());
		const serverConfig = config['api-configuration'];
		const dbConfig = config['db-configuration'];
		host = `http://${serverConfig.host}:${serverConfig.port}`;
		
		global.db = yield Database.connect(dbConfig);
		let adm = yield global.db.collection('users').insert({email:'admin@email.com',password:'fcea920f7412b5da7be0cf42b8c93759',roles:['user','admin']});
		delete adm.password;
		admToken = Security.generateAccessToken(adm, 'secret_key');
		
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

	it('should fail to login with the wrong email', function* () {
		let user = { email: email + 'wrong', password: '123456' };
		let data;
		try {
			var output = yield Http.post(`${host}/signin`, user);
			data = output;
		} catch (e) {
			data = e;
		} finally {
			Assert.equal(data.statusCode, 401);
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
			Assert.equal(data.statusCode, 400);
		}
    });
    
    it('should not allow the user to access role update API using the authorization key when not an admin', function*() {
        let data, config = { email: email, roles: ['user', 'role3'] };
		try {
			var output = yield Http.put(`${host}/update-roles`, config, { 'Authorization': token });
			data = output;
		} catch(e) {
			data = e;
		} finally {
			Assert.equal(data.statusCode, 400);
		}
    });
    
    it('should update an user roles using the authorization token from an admin user', function*() {
        let data, config = { email: email, roles: ['user', 'role3'] };
		try {
			var output = yield Http.put(`${host}/update-roles`, config, { 'Authorization': admToken });
			data = output;
		} catch(e) {
			data = e;
		} finally {
			Assert.equal(data.statusCode, 200);
			const tmp = data.body;
			Assert.equal(tmp.email, config.email, 'Result e-mail is different.');
			Assert(tmp.roles.indexOf('user')>-1, `No role 'user'.`);
			Assert(tmp.roles.indexOf('role3')>-1, `No role 'role3'.`);
		}
    });
	
	after(function*() {
		yield global.db.collection('users').remove({});
		server.close();
	});
});