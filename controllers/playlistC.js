var Playlist = require('../models/playlist');
var Song = require('../models/song');
var Blog = require('../models/blog');
var User = require('../models/user');
var Knex = require('knex');

exports.index = function(req, res) {
	Blog.collection().fetch()
		.then(function(blogs) {
			Playlist.collection().query(function(search) {
				search.where('userid', '=', req.session.userid);
			}).fetch()
			.then(function(lists) {
				res.render('index', {blogs: blogs, user: req.session.user, lists: lists});
			});
		});
};
exports.index2 = function(req, res) {
	res.render('index2');
};

exports.playlists = function(req, res) {
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
	var time = new Date().toISOString().substr(0, 19).replace('T', ' ');
	new Song({vid: req.body.vid}).fetch({require: true})
		.then(function(m) {
			m.save({vid: req.body.vid, name: req.body.name, artist: req.body.artist, genre: req.body.genre, director: req.body.director},{patch: true});
			res.send(200, {});
		}).catch(function(e) {
			new Song().save({vid: req.body.vid, name: req.body.name, artist: req.body.artist, created_at: time},{patch: true});
			res.send(200,{});
		})
}

exports.storeBlog = function(req, res) {
	new Blog({vid: req.body.id}).fetch({require: true})
		.then(function(m) {
			m.save({vid: req.body.id, name: req.body.name, artist: req.body.artist, director: req.body.director, text: req.body.text, date: req.body.stamp, artistLink: req.body.al, directorLink: req.body.dl},{patch: true});
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
			m.destroy();
			res.send(200, {});
		});
}

exports.showList = function(req, res) {
	if(req.session.user) {
		var sql = "(lists LIKE '%," + req.body.lid + ",%')";
		Song.collection().query(function(search) {
			search.where(search.knex.raw(sql));
		}).fetch()
		.then(function(m) {
			new Playlist({id: req.body.lid}).fetch({require: true})
			.then(function(list) {
				res.send({list: list, m: m});
			})
		}).catch(function(e) {
			res.send(400,{});
		});
	}
}

exports.videoSearch = function(req, res) {
	var sql = '(';
	var sql2 = '(';
	var search = req.body.searchParams.split(',');
	for(var i = 0; i < search.length; i++) {
		sql += ' lower(' + search[i] + ") LIKE '" + req.body.sval + "%' OR";
		sql2 += ' lower(' + search[i] + ") LIKE '% " + req.body.sval + "%' OR";
	}
	sql = sql.substring(0, sql.length - 3) + ')';
	sql2 = sql2.substring(0, sql2.length - 3) + ')';
	var filter = req.body.filterParams.split(',');
	if(filter[0].length > 0) {
		for(var j = 0; j < filter.length; j++) {
			sql += ' AND ' + filter[j] + "=1";
			sql2 += ' AND ' + filter[j] + "=1";
		}
	}
	var genres = req.body.genreParams.split(',');
	if(genres[0].length > 0) {
		for(var j = 0; j < genres.length; j++) {
			sql += " AND genre LIKE '%" + genres[j] + "%'";
			sql2 += " AND genre LIKE '%" + genres[j] + "%'";
		}
	}
	Song.collection().query(function(search) {
		search.where(search.knex.raw(sql)).orWhere(search.knex.raw(sql2)).offset(req.body.offset).limit(req.body.limit).orderBy(req.body.sortParams, 'asc');
	}).fetch()
	.then(function(m) {
		res.render('songs', {songs: m, session: req.session}, function(err, model) {
			res.send({html: model});
		});
	});
}

exports.login = function(req, res) {
	new User({username: req.body.user, password: req.body.password}).fetch({require: true})
	.then(function(model) {
		req.session.user = req.body.user;
		req.session.userid = model.id;
		req.session.admin = model.attributes.admin;
		Playlist.collection().query(function(search) {
			search.where('userid', '=', req.session.userid);
		}).fetch()
		.then(function(m1) {
			res.render('myLists', {session: req.session, lists: m1}, function(err, m) {
				res.send({html: m, ses: req.session});
			});
		}).catch(function(e) {
			res.send(400,{});
		});
	}).catch(function(e) {
    	res.send(400, {});
    });
}

exports.getLoginNav = function(req, res) {
	Playlist.collection().query(function(search) {
		search.where('userid', '=', req.session.userid);
	}).fetch()
	.then(function(lists) {
		res.render('myListsNav', {user: req.session.user, lists: lists}, function(err, m) {
			res.send({html: m});
		});
	});
}

exports.deleteSong = function(req, res) {
	new Song({vid: req.body.vid}).fetch({require: true})
	.then(function(song) {
		console.log(song.attributes.lists);
		console.log(String(req.body.lid + ','));
		var lists = song.attributes.lists.replace(String(req.body.lid + ','), '');
		console.log(lists);
		song.save({lists: lists}, {patch: true});
		new Playlist({id: req.body.lid}).fetch({require: true})
		.then(function(list) {
			list.save({the_order: req.body.order}, {patch: true});
			res.send(200, {});
		});
	})
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
		res.send(400, {});
	}).catch(function(e) {
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
		res.send(400, {err: 'found model'});
	}).catch(function(e) {
		new Playlist().save({name: req.body.listName, userid: req.session.userid, the_order: ""}, {patch: true})
		.then(function(m) {
			res.send(m);
		}).catch(function(e) {
			res.send(400, {err: 'error creating'});
		});
	});
}

exports.deleteList = function(req, res) {
	new Playlist({id: req.body.listid}).fetch({require: true})
	.then(function(model) {
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

exports.updateListName = function(req, res) {
	console.log('hello?');
	new Playlist({id: req.body.lid}).fetch({require: true})
	.then(function(m) {
		var name = req.body.name;
		m.save({name: name}, {patch: true});
		res.send(200,{});
	}).catch(function(e) {
		res.send(400,{});
	});
}

// exports.showList = function(req, res) {
// 	if(req.session.user) {
// 		new Playlist({id: req.body.lid}).fetch({require: true})
// 		.then(function(m) {
// 			res.send({m: m});
// 		}).catch(function(e) {
// 			res.send(400,{});
// 		});
// 	}
// }

exports.addSong = function(req, res) {
	new Playlist({id: req.body.lid, userid: req.session.userid}).fetch({require: true})
	.then(function(m) {
		var thumbnail = (m.attributes.the_order.length == 0 ? req.body.vid : m.attributes.the_order.split(',')[0]);
		var order = (m.attributes.the_order.length == 0 ? req.body.vid : m.attributes.the_order + ',' + req.body.vid);
		// var vids = (m.attributes.videoids == null ? req.body.vid : m.attributes.videoids + ',' + req.body.vid);
		// var artists = (m.attributes.artists == null ? req.body.artist :m.attributes.artists + ',' + req.body.artist);
		m.save({thumbnail: thumbnail, the_order: order}, {patch: true});
		new Song({vid: req.body.vid}).fetch({require: true})
			.then(function(song) {
				var lists = (song.attributes.lists.length == 0 ? ',' + req.body.lid + ',' : song.attributes.lists + req.body.lid + ',');
				song.save({lists: lists}, {patch: true});
				res.send(200, {});
			});
	}).catch(function(e) {
		res.send(400,{});
	});
}

exports.updateListOrder = function(req, res) {
	new Playlist({id: req.body.lid}).fetch({require: true})
	.then(function(m) {
		var thumbnail = req.body.order.split(',')[0];
		m.save({thumbnail: thumbnail, the_order: req.body.order},{patch: true});
		res.send(200, {});
	}).catch(function(e) {
		res.send(400,{});
	});
}