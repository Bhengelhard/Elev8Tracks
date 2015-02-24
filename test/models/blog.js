var Model = require('./base');

var Blog = Model.extend({
	tableName: 'blogs'
});

module.exports = Blog;