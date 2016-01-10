'use strict';
/* global describe, it, before, after, global, __dirname; */

const testConfig = `${__dirname}/../test-config.json`;

const base = `${__dirname}/../../src`;
const Assert    = require('assert');
const Core      = require(`${base}/core`);
const Config	= require(`${base}/config`);
const Database  = Core.Database;
const Http      = Core.Http;
const Router    = Core.Router;
const File      = Core.File;
const fs        = require('fs');

let router, serverConfig, host, server;

describe('API HTTP Collection with file upload', () => {
	
	before(function*() {
        let config = JSON.parse((new File(testConfig)).read());
		serverConfig = config['api-configuration'];
		const dbConfig = config['db-configuration'];
		host = `http://${serverConfig.host}:${serverConfig.port}`;
		
		yield Database.connect(dbConfig);
		let router = new Router(config);
		server = router.start(serverConfig.host, serverConfig.port);
	});
    
    it('should manage to upload a file to the server by doing a POST request to \'/uploading\'', function*() {
        let data, obj = { 'fileField': fs.createReadStream(testConfig) };
		try {
			data = yield Http.postForm(`${host}/uploading`, obj);
            data = JSON.parse(data);
		} catch(e) {
			data = e;
		} finally {
			Assert.equal(data.fileField.split('.')[1], 'json');
			Assert.notEqual(data._id, undefined);
		}
    });
	
	after(() => { server.close(); });
});