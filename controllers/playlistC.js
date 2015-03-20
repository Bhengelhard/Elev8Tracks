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
			res.render('blogs', {blogs: m});
		});
}
exports.myLists = function(req, res) {
	res.render('myLists', {layout: false});
}

exports.storeSong = function(req, res) {
	var id = req.params.data.split('&')[0];
	var name = req.params.data.split('&')[1];
	var artist = req.params.data.split('&')[2];
	new Song({vid: id}).fetch({require: true})
		.then(function(m) {
			m.save({vid: id, name: name, artist: artist},{patch: true});
			console.log(m);
			res.send(200, {});
		}).catch(function(e) {
			new Song().save({vid: id, name: name, artist: artist},{patch: true});
			res.send(200,{});
		})
}

exports.storeBlog = function(req, res) {
	var id = req.params.data.split(']&[')[0];
	var text = req.params.data.split(']&[')[1];
	var date = req.params.data.split(']&[')[2];
	var links = req.params.data.split(']&[')[3];
	new Blog({vid: id}).fetch({require: true})
		.then(function(m) {
			m.save({vid: id, text: text, date: date, links: links},{patch: true});
			console.log(m);
			res.send(200, {});
		}).catch(function(e) {
			new Blog().save({vid: id, text: text, date: date, links: links},{patch: true});
			res.send(200,{});
		})
}