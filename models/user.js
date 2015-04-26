var Model = require('./base');

var User = Model.extend({
	tableName: 'users'
});

module.exports = User;