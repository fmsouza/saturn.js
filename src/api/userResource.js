'use strict';
/* global Buffer, db; */
const Core = require('../core');
const Database = Core.Database;
const Common = require('../common');
const Security = Common.Security;
const LoggerFactory = require('../core/log/loggerFactory');

let SECRET_KEY, apiConfig, userConfig, collection;

const logger = LoggerFactory.getRuntimeLogger();

/**
 * UserResource class is responsible for handling the user access control management.
 * @class {UserResource}
 */
class UserResource {
    
    constructor(config) {
        userConfig = config['users'];
        apiConfig = config['api-configuration'];
        SECRET_KEY = apiConfig['private-key'];
        collection = db.collection(userConfig.collection);
    }

    /**
     * Signs up an new user
     * @param {Object} request - HTTP request object data
     * @param {Object} response - HTTP response object data
     * @return {void}
     */
	*signup(request, response) {
		try {
            let body = JSON.parse(JSON.stringify(request.body));
            if(!body.hasOwnProperty('email') || !body.hasOwnProperty('password')) throw new Error('You must inform the user email and password');
            let hasUsers = yield collection.find({ email: body.email });
            if(hasUsers.length>0) throw new Error('This e-mail is already registered.');
            body.password = Security.md5(body.password).toString();
            if(!body.hasOwnProperty('roles')) body.roles = [userConfig['default-role']];
            let obj = yield collection.insert(body);
			delete obj.password;
			response.status(200).jsonp(obj);
		} catch (e) {
			response.status(500).jsonp(e.toString());
		}
	}

    /**
     * Signs in an existing user
     * @param {Object} request - HTTP request object data
     * @param {Object} response - HTTP response object data
     * @return {void}
     */
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
            let obj = yield collection.findOne({ username: body.username, password: Security.md5(body.password).toString() });
            delete obj.password;
            delete obj.created_at;
            delete obj.updated_at;
            const token = Security.generateAccessToken(obj, SECRET_KEY);
            response.status(200).jsonp(token);
		} catch (e) {
            response.writeHead(401, {'WWW-Authenticate': `Basic realm="Provide the email and password"`});
            response.end('Authentication failed.');
            return;
		}
    }

    /**
     * Signs off an existing user
     * @param {Object} request - HTTP request object data
     * @param {Object} response - HTTP response object data
     * @return {void}
     */
	*signoff(request, response) {
        response.status(500).send('');
    }
    
    *updatePassword(request, response) {
        try {
            let token = request.headers['authorization'];
            if(!token) throw new Error('You must be authenticated to do this operation.');
            let body = request.body;
            let data = Security.decryptAccessToken(token, SECRET_KEY);
            let user = yield collection.findOne({ _id: data._id});
            if(!user)
                throw new Error('User not found');
            if(Security.md5(body.currentPassword).toString()!==user.password)
                throw new Error('Current password mismatch.');
                
            let newPass = Security.md5(body.newPassword).toString();
            yield collection.update({ _id: body._id }, { $set: { password: newPass } });
			response.status(200).send('success');
        } catch (e) {
            logger.error(e.stack);
			response.status(500).jsonp(e.toString());
        }
    }
    
    *recoverPassword(request, response) {
        response.status(500).send(JSON.stringify(request.body));
    }
}
module.exports = UserResource;