var Playlist = require('../models/playlist');
var Song = require('../models/song');
var Blog = require('../models/blog');

exports.index = function(req, res) {
	res.render('index');
};
exports.index2 = function(req, res) {
	res.render('index2');
};

exports.playlists = function(req, res) {
	console.log('testing');
	Playlist.collection().fetch()
		.then(function(m) {
			res.send(m);
		});
}

exports.songs = function(req, res) {
	Song.collection().fetch()
		.then(function(m) {
			res.send(m);
		});
}

exports.blogs = function(req, res) {
	Blog.collection().fetch()
		.then(function(m) {
			res.send(m);
		});
}