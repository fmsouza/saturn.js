'use strict';
const LoggerFactory = require('./log/loggerFactory');
const Config  = require('../config');
const ServerDriver = require('express');
const wrapper = require('co-express');
const BodyParser = require("body-parser");
const compression = require('compression');
const helmet = require('helmet');
const GenericResource = require('../api/genericResource');
const UserResource = require('../api/userResource');
const Common = require('../common');
const Security = Common.Security;
const Cache = Common.Cache;

let logger = LoggerFactory.getServerLogger();

function canAccess(token, authorizedRoles, private_key) {
    if(token!==undefined) {
        const data = Security.decryptAccessToken(token, private_key);
        if(!data.hasOwnProperty('roles') || !authorizedRoles) return false;
        let roles = data.roles;
        for (let role of roles) if(authorizedRoles.indexOf(role)>-1) return true;
    }
    return false;
}

function* readFromConfig(route, request, response, resource, config) {
    const accessPolicy = config['access-policy'];
    const policyAllowsRoute = accessPolicy.hasOwnProperty(`/${route}`);
    logger.info(`Policy allows requests to '/${route}': ${policyAllowsRoute}`);
    if(policyAllowsRoute) {
        let access = accessPolicy[`/${route}`];
        const policyAllowsMethod = Object.keys(access).indexOf(request.method)>-1;
        logger.info(`Access Policy allows method '${request.method}': ${policyAllowsMethod}`);
        if(policyAllowsMethod) {
            const methodIsPublic = access[request.method].public;
            logger.info(`Method '${request.method}' is public: ${methodIsPublic}`);
            if(access[request.method].hasOwnProperty('redirect')) {
                const redirectPath = access[request.method].redirect;
                logger.info(`Redirecting to '${redirectPath}'...`);
                response.redirect(redirectPath);
            } else if(methodIsPublic) {
                yield resource[request.method](request, response);
            } else if(canAccess(request.headers['authorization'], access[request.method].roles, config['api-configuration']['private-key'])) {
                yield resource[request.method](request, response);
            } else response.status(400).send(`Method ${request.method} is not publicly allowed for '/${route}'.`);
        } else response.status(400).send(`Method ${request.method} is not allowed for '/${route}'.`);
    } else response.status(404).send(`Route '/${route}' does not exist.`);
}

function *forwardRoute(request, response, resource, config) {
    let tmp = new UserResource(config);
    let route = request.url.split('/')[1];
    let method = request.method;
    switch(route) {
        case 'signup':
            if(method==='POST') yield tmp.signup(request, response);
            else response.status(400).send(`Method ${request.method} is not allowed for '/signup'.`);
            break;
        case 'signin':
            if(method==='POST') yield tmp.signin(request, response);
            else response.status(400).send(`Method ${request.method} is not allowed for '/signin'.`);
            break;
        case 'signoff':
            if(method==='POST') yield tmp.signoff(request, response);
            else response.status(400).send(`Method ${request.method} is not allowed for '/signoff'.`);
            break;
        default:
            yield readFromConfig(route, request, response, resource, config);
            break;
    }
}

/**
 * Class Router represents the RESTful router, which
 * handles all the HTTP routes configured in the application.
 * @class {Router}
 */
class Router {

    constructor(config) {
        this.config = config;
        this.driver = new ServerDriver();
        this.driver.use(compression());
        this.driver.use(helmet());
        this.driver.use(BodyParser.urlencoded({extended: true}));
        this.driver.use(BodyParser.json());
        this.driver.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            res.header("Access-Control-Allow-Methods", config.methods.join(','));
            logger.info(`Serving route ${req.url} (${req.method})`);
            next();
        });
        
        //const accessPolicy = this.config['access-policy'];
        const resource = new GenericResource();
        this.driver.use(wrapper(function*(request, response, next) {
            yield forwardRoute(request, response, resource, config);
        }));
    }

    /**
     * Starts the RESTful server
     * @param {string} ip - Server bind ip
     * @param {number} port - Server bind port
     * @param {Function} callback
     * @returns {void}
     */
    start(ip, port, callback) {
        return this.driver.listen(port, ip, () => {
            if(callback) callback();
            logger.info(`Server started in http://${ip}:${port}`);
        });
    }
}
module.exports = Router;