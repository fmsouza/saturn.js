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

let router, serverConfig, host, server, savedObj;

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
        let data, obj = { fileField: fs.createReadStream(testConfig) };
		try {
			data = yield Http.postForm(`${host}/uploading`, obj);
            data = JSON.parse(data);
		} catch(e) {
			data = e;
		} finally {
            let splitted = data.fileField.split('.');
			Assert.equal(splitted[splitted.length-1], 'json', JSON.stringify(data.fileField));
			Assert.notEqual(data._id, undefined, data._id);
            savedObj = data;
		}
    });
    
    it('should fail to upload a file to the server by doing a POST request to \'/uploading\' with an unsupported file', function*() {
        let data, obj = { 'fileField': fs.createReadStream(`${__dirname}/fileUpload.js`) };
		try {
			data = yield Http.postForm(`${host}/uploading`, obj);
            data = JSON.parse(data);
		} catch(e) {
			data = e;
		} finally {
			Assert.equal(data.statusCode, 500);
		}
    });
    
    it('should manage to retrieve an document with an uploaded file from the server by doing a GET request to \'/uploading\'', function*() {
        let data, obj = { '_id': savedObj._id };
		try {
			data = yield Http.get(`${host}/uploading?query=${JSON.stringify(obj)}`);
		} catch(e) {
			data = e;
		} finally {
			Assert.equal(data.statusCode, 200, data.toString());
            Assert.equal(data.body instanceof Array, true);
			Assert.equal(data.body.length, 1);
            Assert.equal(data.body[0] instanceof Object, true);
			Assert.equal(data.body[0].fileField, savedObj.fileField);
			Assert.equal(data.body[0]._id, savedObj._id);
		}
    });
    
    it('should manage to retrieve an uploaded file from the server by doing a GET request to it\'s path', function*() {
        let data;
		try {
			data = yield Http.get(`${host}/static/${savedObj.fileField}`);
		} catch(e) {
			data = e;
		} finally {
			Assert.equal(data.statusCode, 200, data.toString());
            Assert.equal(data.body instanceof Object, true);
            Assert.notEqual(data.body['api-configuration'], undefined);
            Assert.equal(data.body['api-configuration']['host'], '0.0.0.0');
            Assert.equal(data.body['api-configuration']['port'], '8080');
		}
    });
	
	after(() => { server.close(); });
});