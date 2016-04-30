'use strict';
/**
 * Class responsible for send mails
 * @class MailServer
 */
class MailServer {
	
	constructor(config) {
        if(!config) config = Config.mail;
		this.driver = require('emailjs/email').server.connect(config);
	}
	
	/**
	 * Sends the mail
	 * @param {any} mail
	 * @param {Function} callback
	 * @return {void}
	 */
	sendMail(mail, callback) {
		this.driver.send(mail, callback);
	}
}
module.exports = MailServer;