'use strict';
const Crypto = require('crypto-js');

/**
 * Security class has procedures focused in the protection of data and access control
 * @class {Security}
 */
class Security {
    
    /**
     * Return the md5 hash of a given string
     * @param {string} content - Text content
     * @return {string}
     */
    static md5(content) {
        return Crypto.MD5(content);
    }
    
    /**
     * Generates an access token used for users sign in
     * @param {Object} data - Data to be encrypted and used to generate the key
     * @param {string} secret_key - The secret key used for encrypting the data
     * @return {string}
     */
    static generateAccessToken(data, secret_key) {
        const cypher = Crypto.AES.encrypt(JSON.stringify(data), secret_key);
        return cypher.toString();
    }
    
    /**
     * Decrypts an access token
     * @param {string} token - Access token
     * @param {string} secret_key - The secret key used for decrypting the data
     * @return {Object}
     */
    static decryptAccessToken(token, secret_key) {
        let bytes = Crypto.AES.decrypt(token, secret_key);
        return JSON.parse(bytes.toString(Crypto.enc.Utf8));
    }
}
module.exports = Security;