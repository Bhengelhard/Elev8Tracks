var Knex = require('../init/knex');

exports.mobile = function(req, res) {
	Knex('songs').join('popularity', 'songs.vid', '=', 'popularity.vid').orderBy('pop_trending', 'desc').limit(75)
	.then(function(songs) {
		res.render('mobile', {songs: songs});
	});
}