'use strict';
/* global Buffer, db; */
const Common = require('../common');
const MailServer = require('../core/mail/server');
const Security = Common.Security;
const LoggerFactory = require('../core/log/loggerFactory');

let SECRET_KEY, apiConfig, userConfig, mailConfig, collection;

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
        mailConfig = config['mail-config'];
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
            body = { email: auth[0], password: auth[1] };
        } else {
            response.writeHead(401, {'WWW-Authenticate': `Basic realm="Provide the email and password"`});
            response.end('Authorization required');
            return;
        }
        console.log(`Body: ${JSON.stringify(body)}`);
        console.log(`E-mail: ${body.email}`);
        console.log(`Password: ${body.password}`);
		try {
            let obj = yield collection.findOne({ email: body.email, password: Security.md5(body.password).toString() });
            console.log(`Obj: ${JSON.stringify(obj)}`);
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

    /**
     * Updates an existing user's roles
     * @param {Object} request - HTTP request object data
     * @param {Object} response - HTTP response object data
     * @return {void}
     */
    *updateRoles(request, response) {
        try {
            let token = request.headers['authorization'];
            if(!token) throw new Error('You must be authenticated to do this operation.');
            let data = Security.decryptAccessToken(token, SECRET_KEY);
            let adm = yield collection.findOne({ _id: data._id});
            if(!adm) throw new Error('User not found.');
            if(adm.roles.indexOf('admin')===-1) throw new Error('You do not have privileges do this operation.');
            
            let body = request.body;
            let user = yield collection.findOne({ email: body.email });
            if(!user) throw new Error('The user you want to update does not exist.');
            user.roles = body.roles;
            yield user.save();
            delete user.password;
            delete user.created_at;
            delete user.updated_at;
            response.status(200).jsonp(user);
        } catch (e) {
            logger.error(e.stack);
            response.status(400).jsonp(e.toString());
        }
    }

    /**
     * Updates an existing user's password
     * @param {Object} request - HTTP request object data
     * @param {Object} response - HTTP response object data
     * @return {void}
     */
    *updatePassword(request, response) {
        try {
            let token = request.headers['authorization'];
            if(!token) throw new Error('You must be authenticated to do this operation.');
            let body = request.body;
            let data = Security.decryptAccessToken(token, SECRET_KEY);
            let user = yield collection.findOne({ _id: data._id});
            if(!user)
                throw new Error('User not found.');
            if(!data.recovery && Security.md5(body.currentPassword).toString()!==user.password)
                throw new Error('Current password mismatch.');
                
            user.password = Security.md5(body.newPassword).toString();
            yield user.save();
			response.status(200).send('success');
        } catch (e) {
            logger.error(e.stack);
			response.status(500).jsonp(e.toString());
        }
    }

    /**
     * Recovers an existing user's password
     * @param {Object} request - HTTP request object data
     * @param {Object} response - HTTP response object data
     * @return {void}
     */
    *recoverPassword(request, response) {
        try {
            let email = request.body.email;
            if(!email) throw new Error('The user e-mail must be provided.');
            let user = yield collection.findOne({ email: email });
            if(!user) throw new Error('This user does not exist.');
            user.recovery = true;
            delete user.password;
            delete user.created_at;
            delete user.updated_at;
            const token = Security.generateAccessToken(user, SECRET_KEY);
            
            let msgConfig = mailConfig.message;
            let serverConfig = mailConfig.server;
            let address = `${apiConfig['base-url']}/${token}`;
            
            let mail = {};
            mail.from = msgConfig.from;
            mail.to = email;
            mail.subject = msgConfig.subject;
            mail.text = msgConfig.text.replace(/\$\$/, address);
            
            let server = new MailServer(serverConfig);
            server.sendMail(mail, (error, message) => {
                if(error) console.log(error.toString());
                response.status(200).send('success');
            });
        } catch (e) {
            logger.error(e.stack);
			response.status(500).jsonp(e.toString());
        }
    }
}
module.exports = UserResource;