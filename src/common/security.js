'use strict';
const Crypto = require('crypto-js');

class Security {
    
    static md5(content) {
        return Crypto.MD5(content);
    }
    
    static generateAccessToken(data, secret_key) {
        const cypher = Crypto.AES.encrypt(JSON.stringify(data), secret_key);
        return cypher.toString();
    }
    
    static validateAccessToken(token, secret_key) {
        let bytes = Crypto.AES.decrypt(token, secret_key);
        return JSON.parse(bytes.toString(Crypto.enc.Utf8));
    }
}
module.exports = Security;