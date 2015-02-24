var Bookshelf = require('../init/bookshelf');

var BaseModel = Bookshelf.Model.extend({

	// setup any
	displayName: function() {
		return this.get('name') || 'no name';
	}

});

module.exports = BaseModel;