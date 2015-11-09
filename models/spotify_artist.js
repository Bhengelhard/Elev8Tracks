var Model = require('./base');

var Artist = Model.extend({
	tableName: 'spotify_artists'
});

module.exports = Artist;