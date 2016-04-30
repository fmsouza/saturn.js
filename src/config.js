/* global __dirname, process; */
/**
 * Application configuration
 * You may use it to describe every global configuration data
 */
module.exports = {
    root: __dirname,
    logs: {
        runtime: '/tmp/runtime.log',
        server: '/tmp/server.log'
    },
    server: {
        ip: process.env.NODEJS_SERVER_IP     || '0.0.0.0',
        port: process.env.NODEJS_SERVER_PORT || 8080
    },
    database: {
        dbName: process.env.NODEJS_DB_NAME   || 'nodejs',
        host: process.env.NODEJS_DB_HOST     || 'localhost',
        port: process.env.NODEJS_DB_PORT     || 27017,
        user: process.env.NODEJS_DB_USER     || '',
        pass: process.env.NODEJS_DB_PASS     || ''
    },
    mail: {
        user: process.env.NODEJS_MAIL_USER     || '',
        password: process.env.NODEJS_MAIL_PASS || '',
        host: process.env.NODEJS_MAIL_HOST     || ''
    },
    resources: [
        'api/collectionResource',
        'api/pagingResource'
    ]
};