'use strict';
const Driver = require('robe');
const Config = require('../config');
	
function connect(config) {
	if(!config) config = Config.database;
	var url = `${config.host}:${config.port}/${config.dbName}`;
	if(config.user!=='' && config.pass!=='') url = `${config.user}:${config.pass}@${url}`;
	return Driver.connect(url);
}

module.exports = {
	connect: connect
};