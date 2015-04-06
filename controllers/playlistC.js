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
			console.log(m);
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
	console.log(req.body.name);
	// var id = req.params.data.split(']&[')[0];
	// var name = req.params.data.split(']&[')[1];
	// var artist = req.params.data.split(']&[')[2];
	// var director = req.params.data.split(']&[')[3];
	// var text = req.params.data.split(']&[')[4];
	// var stamp = req.params.data.split(']&[')[5];
	// var al = req.params.data.split(']&[')[6];
	// var dl = req.params.data.split(']&[')[7];
	// while(al.indexOf('^^') > -1) {
	// 	al = al.replace('^^','/');
	// }
	// while(dl.indexOf('^^') > -1) {
	// 	dl = dl.replace('^^','/');
	// }
	new Blog({vid: req.body.id}).fetch({require: true})
		.then(function(m) {
			m.save({vid: req.body.id, name: req.body.name, artist: req.body.artist, director: req.body.director, text: req.body.text, date: req.body.stamp, artistLink: req.body.al, directorLink: req.body.dl},{patch: true});
			console.log(m);
			res.send(200, {});
		}).catch(function(e) {
			new Blog().save({vid: req.body.id, name: req.body.name, artist: req.body.artist, director: req.body.director, text: req.body.text, date: req.body.stamp, artistLink: req.body.al, directorLink: req.body.dl},{patch: true});
			res.send(200,{});
		})
}

exports.removeBlock = function(req, res) {
	var id = req.params.data;
	new Song({vid: id}).fetch({require: true})
		.then(function(m) {
			console.log(m);
			m.destroy();
			res.send(200, {});
		});
}

exports.videoSearch = function(req,res) {
	if(req.params.data == '*') {
		Song.collection().fetch()
		.then(function(m) {
			res.render('songs', {songs: m});
		});
	} else {
		var ss = '% ' + req.params.data + '%';
		var ss2 = req.params.data + '%';
		Song.collection().query(function(search) {
			search.where('name', 'LIKE', ss).orWhere('name','LIKE', ss2).orWhere('artist', 'LIKE', ss).orWhere('artist', 'LIKE', ss2).limit(25);
		}).fetch()
			.then(function(m) {
				res.render('songs', {songs: m});
			});
	}
}