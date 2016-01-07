'use strict';

class FieldValidator {
    
    constructor(rules) {
        this.rules = rules;
    }
    
    checkType(type, field, fn) {
        try { return fn(); }
        catch(e) { throw new Error(`The type of the field '${field}' content must be '${type}'.`); }
    }
    
    parseType(type, value, field) {
        if(type==='string') return this.checkType(type, field, () => {
            return value.toString();
        });
        else if(type==='date') return this.checkType(type, field, () => {
            let tmp = new Date(value);
            if(tmp instanceof Date) return tmp;
            else throw new Error('');
        });
        else return this.checkType(type, field, () => {
            let tmp = JSON.parse(value);
            if(typeof tmp === type) return tmp;
            else throw new Error('');
        });
    }
    
    validate(data) {
        let output = {};
        for(let rule of Object.keys(this.rules)) {
            let tmp = this.rules[rule];
            try {
                if(data.hasOwnProperty(rule)) output[rule] = this.parseType(tmp.type, data[rule], rule);
                else if(tmp.required) throw new Error(`The field '${rule}' is required.`);
            } catch(e) {
                if(e.message==='') throw new Error(`The type of the field '${rule}' content must be '${tmp.type}'.`);
                else throw e;
            }
        }
        return output;
    }
}

module.exports = FieldValidator;