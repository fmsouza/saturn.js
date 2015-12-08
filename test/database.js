'use strict';
/* global describe, it, before; */

const Assert = require('assert');
const Database = require('../src/core').Database;
const Model = Database.Model;

class Test extends Model {
	get title() { return this.get('title'); }
	set title(value) { this.set('title', value); }
	get foo() { return this.get('foo'); }
	set foo(value) { this.set('foo', value); }
}

var test;

describe('Database', () => {
	
	before(function*() { yield Database.connect(); });
	
	it('should insert data in the collection tests', function*() {
		test = new Test({ title: 'Fulano' });
		yield test.save();
		
		const item = yield Test.findOne({title: 'Fulano'});
		Assert.equal(item.title, 'Fulano');
	});
	
	it('should update data in the collection tests', function*() {
		test.foo = 'bar';
		yield test.save();
		
		const item = yield Test.findOne({title: 'Fulano'});
		Assert.equal(item.foo, 'bar');
	});
	
	it('should retrieve all documents in the collection tests', function*() {
		const items = yield Test.find();
		Assert.equal(items.length, 1);
	});
	
	it('should remove all the data in the collection tests', function*() {
		yield test.remove();
		const items = yield Test.find();
		Assert.equal(items.length, 0);
	});
});