var Playlist = require('../models/playlist');
var Song = require('../models/song');
var Blog = require('../models/blog');

exports.index = function(req, res) {
	Playlist.collection().fetch()
		.then(function(m) {
			res.render('index', {lists: m});
		});
};
exports.index2 = function(req, res) {
	res.render('index2');
};

exports.playlists = function(req, res) {
	Playlist.collection().fetch()
		.then(function(m) {
			res.render('lists', {lists: m});
		});
}
exports.playlistmodel = function(req, res) {
	Playlist.collection().fetch()
		.then(function(m) {
			res.send(m);
		});
}

exports.songs = function(req, res) {
	Song.collection().fetch()
		.then(function(m) {
			res.render('songs', {songs: m});
		});
}

exports.blogs = function(req, res) {
	Blog.collection().fetch()
		.then(function(m) {
			res.send(m);
		});
}
exports.myLists = function(req, res) {
	res.render('myLists', {layout: false});
}