var Model = require('./base');

var Song = Model.extend({
	tableName: 'songs'
});

module.exports = Song;