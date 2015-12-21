'use strict';
const LoggerFactory = require('./log/loggerFactory');
const Config  = require('../config');
const ServerDriver = require('express');
const wrapper = require('co-express');
const BodyParser = require("body-parser");
const compression = require('compression');
const helmet = require('helmet');
const GenericResource = require('../api/genericResource');

let logger = LoggerFactory.getServerLogger();

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
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            res.header("Access-Control-Allow-Methods", config.methods.join(','));
            logger.info(`Serving route ${req.url} (${req.method})`);
            next();
        });
        
        const accessPolicy = this.config['access-policy'];
        const resource = new GenericResource();
        this.driver.use(wrapper(function*(request, response, next) {
            const policyAllowsRoute = accessPolicy.hasOwnProperty(request.url);
            logger.info(`Policy allows requests to '${request.url}': ${policyAllowsRoute}`);
            if(policyAllowsRoute) {
                let access = accessPolicy[request.url];
                const policyAllowsMethod = Object.keys(access).indexOf(request.method)>-1;
                logger.info(`Access Policy allows method '${request.method}': ${policyAllowsMethod}`);
                if(policyAllowsMethod) {
                    const methodIsPublic = access[request.method].public;
                    logger.info(`Method '${request.method}' is public: ${methodIsPublic}`);
                    if(methodIsPublic) {
                        yield resource[request.method](request, response);
                    } else {
                        response.status(400).send(`Method ${request.method} is not publicly allowed for ${request.url}.`);
                    }
                } else {
                    response.status(400).send(`Method ${request.method} is not allowed for ${request.url}.`);
                }
            } else next();
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