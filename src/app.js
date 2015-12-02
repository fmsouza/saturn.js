'use strict';
/* global process, global; */
const Config        = require('./config');
const Core          = require('./core');
const LoggerFactory = Core.LoggerFactory;
const Router        = Core.Router;
const Database      = Core.Database;
const spawn         = require('co');

const logger = LoggerFactory.getRuntimeLogger();
const Process = process;

spawn(function* main(){
    logger.info('Starting the server...');
    
    global.database = yield Database.connect(); // Creating connection to database

    // Configuring the RESTful router to handle HTTP requests
    let router = new Router();
    router.registerResources(Config.resources); // Registering resources to handle the URLs
    
    let server = Config.server;
    router.start(server.ip, server.port); // Starting RESTful application
})
.catch(function(error) {
    logger.error(error);
    Process.exit(1);
});