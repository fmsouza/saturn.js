'use strict';
/* global db; */
const Core = require('../core');
const Common = require('../common');
const Database = Core.Database;
const FieldValidator = Common.FieldValidator;
const LoggerFactory = require('../core/log/loggerFactory');
const URL = require('url');

const logger = LoggerFactory.getRuntimeLogger();

/**
 * GenericResource class is responsible for handling all CRUD operations, data validation and interaction with the repository.
 * @class {GenericResource}
 */
class GenericResource {

    /**
     * Retrieves information from the repository
     * @param {Object} request - HTTP request object data
     * @param {Object} response - HTTP response object data
     * @return {void}
     */
	*GET(request, response, policy) {
        let url = URL.parse(request.url, true);
        const params = url.pathname.split('/');
        let collection = db.collection(params[1]);
		const body = url.query;
        let options = {};
        
        if(body.query) body.query = JSON.parse(body.query);
        else body.query = {};
        
        if(policy.hasOwnProperty('fields')) {
            const validator = new FieldValidator(policy.fields);
            body.query = validator.validate(body.query, false);
        }
        
		if(body.sort) {
            body.sort = JSON.parse(body.sort);
            options.sort = body.sort;
		}
        if(params.length===5 && params[2]==='page' && !isNaN(params[3]) && !isNaN(params[4])) {
            let docs = parseInt(params[3]);
            let skipped = docs*(parseInt(params[4])-1);
            options.limit = docs;
            options.skip = skipped;
        }
        
		try {
            let data = (Object.keys(options).length>0)? yield collection.find(body.query, options) : yield collection.find(body.query);
			response.status(200).jsonp(data);
		} catch (e) {
            logger.error(e.stack);
			response.status(500).jsonp(e.toString());
		}
	}

    /**
     * Saves information to the repository
     * @param {Object} request - HTTP request object data
     * @param {Object} response - HTTP response object data
     * @return {void}
     */
	*POST(request, response, policy) {
        const params = request.url.split('/');
        let collection = db.collection(params[1]);
        let body = request.body || {};
        if(request.hasOwnProperty('files')) {
            let files = request.files || [];
            for (let index in files) {
                body[files[index].fieldname] = files[index];
            }
        }
        
		try {
            if(policy.hasOwnProperty('fields')) {
                const validator = new FieldValidator(policy.fields);
                body = validator.validate(body, true);
            }
            yield collection.insert(body);
			response.status(200).jsonp(body);
		} catch (e) {
            if(!body._id) {
                logger.error(e.stack);
                response.status(500).jsonp(e.toString());
            } else response.status(200).jsonp(body);
		}
	}

    /**
     * Updates information in the repository
     * @param {Object} request - HTTP request object data
     * @param {Object} response - HTTP response object data
     * @return {void}
     */
	*PUT(request, response, policy) {
        const params = request.url.split('/');
        let collection = db.collection(params[1]);
        let body = request.body || {};
        if(request.hasOwnProperty('files')) {
            let files = request.files || [];
            for (let index in files) {
                body[files[index].fieldname] = files[index];
            }
        }
        
		try {
            let query = { _id: body._id };
            delete body._id;
            yield collection.update(query, body);
			response.status(200).send('success');
		} catch (e) {
            logger.error(e.stack);
			response.status(500).jsonp(e.toString());
		}
	}

    /**
     * Removes information from the repository
     * @param {Object} request - HTTP request object data
     * @param {Object} response - HTTP response object data
     * @return {void}
     */
	*DELETE(request, response, policy) {
        let url = URL.parse(request.url, true);
        const params = url.pathname.split('/');
        let collection = db.collection(params[1]);
		const body = url.query;
        if(body.query) body.query = JSON.parse(body.query);
        
		try {
            let obj = collection.remove(body.query);
			response.status(200).send('success');
		} catch (e) {
            logger.error(e.stack);
			response.status(500).jsonp(e.toString());
		}
	}
}
module.exports = GenericResource;