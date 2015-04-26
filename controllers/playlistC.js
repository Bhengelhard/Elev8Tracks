var Playlist = require('../models/playlist');
var Song = require('../models/song');
var Blog = require('../models/blog');
var User = require('../models/user');

exports.index = function(req, res) {
	Playlist.collection().fetch()
		.then(function(m) {
			res.render('index', {lists: m, session: req.session});
		});
};
exports.index2 = function(req, res) {
	res.render('index2');
};

exports.playlists = function(req, res) {
	console.log(req.session);
	Playlist.collection().fetch()
		.then(function(m) {
			res.render('lists', {lists: m, session: req.session});
		});
}
exports.playlistmodel = function(req, res) {
	Playlist.collection().fetch()
		.then(function(m) {
			res.send(m);
		});
}

exports.songs = function(req, res) {
	console.log(req.session);
	Song.collection().fetch()
		.then(function(m) {
			res.render('songs', {songs: m, session: req.session});
		});
}

exports.blogs = function(req, res) {
	Blog.collection().fetch()
		.then(function(m) {
			res.render('blogs', {blogs: m});
		});
}
exports.myLists = function(req, res) {
	console.log('test');
	if(req.session.user) {
		Playlist.collection().query(function(search) {
			search.where('userid', '=', req.session.userid);
		}).fetch()
		.then(function(m1) {
			res.render('myLists', {session: req.session, lists: m1});
		}).catch(function(e) {
			res.send(400,{});
		});
	} else {
		res.render('login', {layout: false});
	}
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

exports.videoSearch = function(req, res) {
	if(req.body.sval == '') {
		Song.collection().fetch()
		.then(function(m) {
			res.render('songs', {songs: m, session: req.session}, function(err, model) {
				res.send({html: model});
			});
		});
	} else {
		var ss = '% ' + req.body.sval + '%';
		var ss2 = req.body.sval + '%';
		Song.collection().query(function(search) {
			search.where('name', 'LIKE', ss).orWhere('name','LIKE', ss2).orWhere('artist', 'LIKE', ss).orWhere('artist', 'LIKE', ss2).limit(25);
		}).fetch()
			.then(function(m) {
				res.render('songs', {songs: m, session: req.session}, function(err, model) {
					res.send({html: model});
				});
			});
	}
}

exports.login = function(req, res) {
	new User({username: req.body.user, password: req.body.password}).fetch({require: true})
	.then(function(model) {
		req.session.user = req.body.user;
		req.session.userid = model.attributes.id;
		req.session.admin = model.attributes.admin;
		console.log(req.session);
		Playlist.collection().query(function(search) {
			search.where('userid', '=', req.session.userid);
		}).fetch()
		.then(function(m1) {
			console.log(m1);
			res.render('myLists', {session: req.session, lists: m1}, function(err, m) {
				res.send({html: m});
			});
		}).catch(function(e) {
			res.send(400,{});
		});
	}).catch(function(e) {
    	res.send(400, {});
    });
}

exports.logout = function(req, res) {
	req.session.destroy();
	req.session = null;
	res.render('login', {}, function(err, m) {
		res.send({html: m});
	});
}

exports.signUp = function(req, res) {
	new User({username: req.body.user, password: req.body.password}).fetch({require: true})
	.then(function(model) {
		console.log('found');
		res.send(400, {});
	}).catch(function(e) {
		console.log(req.body.user);
    	new User().save({username: req.body.user, password: req.body.password, email: req.body.email}, {patch: true})
		.then(function(model) {
			req.session.user = req.body.user;
			req.session.userid = model.id;
			req.session.admin = model.admin;
			res.render('myLists', {session: req.session}, function(err, m) {
				res.send({html: m});
			});
		}).catch(function(e) {
	    	res.send(400, {});
	    });
    });
}

exports.createList = function(req, res) {
	new Playlist({name: req.body.listName, userid: req.session.userid}).fetch({require: true})
	.then(function(model) {
		console.log('found');
		res.send(400, {});
	}).catch(function(e) {
		new Playlist().save({name: req.body.listName, userid: req.session.userid}, {patch: true})
		.then(function(m) {
			console.log(m);
			res.send(m);
		}).catch(function(e) {
	    	res.send(400, {});
	    });
	});
}

exports.deleteList = function(req, res) {
	console.log(req.body.listid);
	new Playlist({id: req.body.listid}).fetch({require: true})
	.then(function(model) {
		console.log(model);
		model.destroy();
		res.send(200, {});
	}).catch(function(e) {
		res.send(400,{});
	});
}

exports.userPlaylists = function(req, res) {
	Playlist.collection().query(function(search) {
			search.where('userid', '=', req.session.userid);
	}).fetch()
	.then(function(m) {
		res.send(m);
	}).catch(function(e) {
		res.send(400,{});
	});
}

exports.saveSong = function(req, res) {
	new Playlist({name: req.body.list, userid: req.session.userid}).fetch({require: true})
	.then(function(m) {
		console.log(m.attributes.videoids);
		var thumbnail = (m.attributes.videoids == null ? req.body.vid : m.attributes.videoids.split(',')[0]);
		var songs = (m.attributes.vnames == null ? req.body.song : m.attributes.vnames + ',' + req.body.song);
		var vids = (m.attributes.videoids == null ? req.body.vid : m.attributes.videoids + ',' + req.body.vid);
		var artists = (m.attributes.artists == null ? req.body.artist :m.attributes.artists + ',' + req.body.artist);
		console.log(songs);
		m.save({vnames: songs, videoids: vids, artists: artists, thumbnail: thumbnail}, {patch: true});
		console.log(m);
		res.send(200, {});
	}).catch(function(e) {
		res.send(400,{});
	});
}

exports.updateList = function(req, res) {
	new Playlist({id: req.body.listid}).fetch({require: true})
	.then(function(m) {
		var thumbnail = req.body.vids.split(',')[0];
		m.save({name: req.body.listName, vnames: req.body.names, videoids: req.body.vids, thumbnail: thumbnail, artists: req.body.artists},{patch: true});
		res.send(200, {});
	}).catch(function(e) {
		res.send(400,{});
	});
}