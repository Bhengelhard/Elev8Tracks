var Model = require('./base');

var songGenre = Model.extend({
	tableName: 'songs_genres'
});

module.exports = songGenre;