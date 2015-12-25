var Model = require('./base');

var songList = Model.extend({
	tableName: 'songs_playlists'
});

module.exports = songList;