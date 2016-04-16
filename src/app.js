'use strict';
/* global process, global; */
const Config        = require('./config');
const Core          = require('./core');
const LoggerFactory = Core.LoggerFactory;
const Router        = Core.Router;
const Database      = Core.Database;
const File          = Core.File;
const spawn         = require('co');

const logger = LoggerFactory.getRuntimeLogger();
const Process = process;
global.Log = logger;
let configContent;

// check if the path to the config file was given
if(process.argv.length<3) {
    logger.error('You must provide a config file to start the server.');
    Process.exit(1);
}

// Reads the given config file or stops the application if it does not exist.
try {
    configContent = (new File(Process.argv[2])).read();
} catch(e) {
    logger.error('The provided config file does not exist.');
    Process.exit(1);
}

spawn(function* main(){
    logger.info('Starting the server...');
    let config = JSON.parse(configContent);
    let dbConfig = config['db-configuration'];
    global.db = yield Database.connect(dbConfig); // Creating connection to database

    // Configuring the RESTful router to handle HTTP requests
    let router = new Router(config);
    let server = config['api-configuration'];
    router.start(server.host, server.port); // Starting RESTful application
})
.catch(function(error) {
    logger.error(error);
    Process.exit(1);
});