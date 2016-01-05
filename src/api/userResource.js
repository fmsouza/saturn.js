'use strict';
/* global Buffer; */
const Core = require('../core');
const Database = Core.Database;
const Collection = require('../collectionModel');
const Common = require('../common');
const Security = Common.Security;

let SECRET_KEY;

class UserResource {
    
    constructor(config) {
        let userConfig = config['users'];
        let apiConfig = config['api-configuration'];
        SECRET_KEY = apiConfig['private-key'];
		Collection.prototype.collection = userConfig.collection;
    }

	*signup(request, response) {
		try {
            let body = request.body;
            if(!body.hasOwnProperty('email') || !body.hasOwnProperty('password')) throw new Error('You must inform the user email and password');
            body.password = Security.md5(body.password).toString();
			let obj = new Collection(body);
			yield obj.save();
            obj.unset('password');
			response.status(200).jsonp(obj);
		} catch (e) {
			response.status(500).jsonp(e.toString());
		}
	}

	*signin(request, response) {
        let body;
        if(request.body.hasOwnProperty('email') && request.body.hasOwnProperty('password')) body = request.body;
        else if(request.headers.authorization) {
            let auth = request.headers.authorization.replace(/^Basic /, '');
            auth = (new Buffer(auth, 'base64').toString('utf8'));
            auth = auth.split(':');
            body = { username: auth[0], password: auth[1] };
        } else {
            response.writeHead(401, {'WWW-Authenticate': `Basic realm="Provide the email and password"`});
            response.end('Authorization required');
            return;
        }
		try {
            let obj = yield Collection.findOne({ username: body.username, password: Security.md5(body.password).toString() });
            const token = Security.generateAccessToken(obj, SECRET_KEY);
			response.status(200).jsonp(token);
		} catch (e) {
            response.writeHead(401, {'WWW-Authenticate': `Basic realm="Provide the email and password"`});
            response.end('Authentication failed.');
            return;
		}
    }

	*signoff(request, response) {
        response.status(500).send('');
    }
}
module.exports = UserResource;