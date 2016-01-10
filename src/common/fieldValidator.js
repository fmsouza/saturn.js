'use strict';

/**
 * FieldValidator class is responsible for validating the inputted data in the API requests
 * before doing the communication with the database
 * @class {FieldValidator} 
 */
class FieldValidator {
    
    constructor(rules) {
        this.rules = rules;
    }
    
    /**
     * Checks it the field content type meets the required type
     * @param {string} type - Field type
     * @param {string} field - Field name
     * @param {Function} fn - Procedure to check the type
     * @return {*}
     * @throw {Error}
     */
    checkType(type, field, fn) {
        try { return fn(); }
        catch(e) { throw new Error(`The type of the field '${field}' content must be '${type}'.`); }
    }
    
    /**
     * Tries to parse the field value to it's expected type
     * @param {string} type - Field type
     * @param {*} value - Field content
     * @param {string} field - Field name
     * @return {*}
     * @throw {Error}
     */
    parseType(type, value, field) {
        if(typeof type==='object' && type.length!==undefined) return this.checkType(type, field, () => {
            if(type.indexOf(value.mimetype)>-1) {
                let ext = value.originalname.split('.');
                return `${value.path}.${ext[ext.length-1]}`;
            }
            else throw new Error('');
        });
        else if(type==='string') return this.checkType(type, field, () => {
            return value.toString();
        });
        else if(type==='date') return this.checkType(type, field, () => {
            let tmp = new Date(value);
            if(tmp instanceof Date) return tmp;
            else throw new Error('');
        });
        else if(type instanceof Array) return this.checkType(type, field, () => {
            console.log(value);
            throw new Error('');
        });
        else return this.checkType(type, field, () => {
            let tmp = JSON.parse(value);
            if(typeof tmp === type) return tmp;
            else throw new Error('');
        });
    }
    
    /**
     * Validates the input data
     * @param {Object} data - Input data
     * @return {Object}
     * @throw {Error}
     */
    validate(data) {
        let output = {};
        Object.keys(this.rules).forEach( (rule) => {
            let tmp = this.rules[rule];
            try {
                if(data[rule]!==undefined) output[rule] = this.parseType(tmp.type, data[rule], rule);
                else if(tmp.required) throw new Error(`The field '${rule}' is required.`);
            } catch(e) {
                let type = (typeof tmp.type==='object' && tmp.type.length!==undefined)? tmp.type.join(', ') : tmp.toString();
                if(e.message==='') throw new Error(`The type of the field '${rule}' content must be '${type}'.`);
                else throw e;
            }
        });
        return output;
    }
}

module.exports = FieldValidator;