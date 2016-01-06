var Knex = require('../init/knex');

exports.index = function(req, res) {
	Knex('blogs')
		.then(function(blogs) {
			Knex('playlists').where('userid', req.session.userid)
			.then(function(lists) {
				Knex('genres').distinct('genre_1','genre_1_id').select()
				.then(function(genres) {
					res.render('index', {blogs: blogs, user: req.session.user, spotify: req.session.spotifyID, lists: lists, genres: genres, count: 0});
				});
			});
		});
};
exports.index2 = function(req, res) {
	res.render('index2');
};

exports.playlists = function(req, res) {
	Knex('playlists')
		.then(function(m) {
			res.render('lists', {lists: m, session: req.session});
		});
}
exports.playlistmodel = function(req, res) {
	Knex('playlists')
		.then(function(m) {
			res.send(m);
		});
}

exports.songs = function(req, res) {
	Knex('songs')
		.then(function(m) {
			res.render('songs', {songs: m, session: req.session});
		});
}

exports.blogs = function(req, res) {
	Knex('blogs')
		.then(function(m) {
			Knex('genres').distinct('genre_1','genre_1_id').select()
			.then(function(genres) {
				res.render('home', {spotify: req.session.spotifyID, blogs: m, genres: genres});
			});
		});
}
exports.myLists = function(req, res) {
	if(req.session.user) {
		Knex('playlists').where('userid',req.session.userid)
		.then(function(lists) {
			Knex('genres').distinct('genre_4')
			.then(function(genres) {
				res.render('myLists', {session: req.session, lists: lists, genres: genres}, function(err, m) {
					res.send({html: m, ses: req.session});
				});
			});
		}).catch(function(e) {
			res.send(400,{});
		});
	} else {
		res.render('login', {}, function(err, m) {
			res.send({html: m});
		});
	}
}

exports.storeSong = function(req, res) {
	var time = new Date().toISOString().substr(0, 19).replace('T', ' ');
	var genre_4 = req.body.genre.split(',');
	var sql = '';
	for(var i = 0; i < genre_4.length; i++) {
		sql += "genre_4 = '" + genre_4[i] + "' OR ";
	}
	sql = sql.substring(0,sql.length-4);
	Knex('genres').whereRaw(sql)
	.then(function(genres) {
		Knex('songs').where('vid', req.body.vid)
		.then(function(song) {
			if(song.length != 0) {
				Knex('songs').where('vid', req.body.vid).update({vid: req.body.vid, name: req.body.name, artist: req.body.artist, genre: req.body.genre, created_at: time});
				Knex('songs_genres').where('song_id',song[0].id).del()
				.then(function(song_genres) {
					genres.forEach(function(genre) {
						Knex('songs_genres').insert({song_id: song[0].id, genre_1_id: genre.genre_1_id, genre_2_id: genre.genre_2_id})
					});
					res.send(200,{});
				})
			} else {
				Knex('songs').insert({vid: req.body.vid, name: req.body.name, artist: req.body.artist, genre: req.body.genre, created_at: time})
				.then(function(song) {
					genres.forEach(function(genre) {
						Knex('songs_genres').insert({song_id: song[0].id, genre_1_id: genre.genre_1_id, genre_2_id: genre.genre_2_id});
					});
					res.send(200,{});
				}).catch(function(e) {
					res.send(400,{});
				});
			}
		});
	});
}

exports.storeBlog = function(req, res) {
	Knex('blogs').where('vid',req.body.vid)
		.then(function(m) {
			if(m.length != 0) {
				Knex('blogs').where('vid',req.body.vid).update({vid: req.body.id, name: req.body.name, artist: req.body.artist, director: req.body.director, text: req.body.text, date: req.body.stamp, artistLink: req.body.al, directorLink: req.body.dl});
			} else {
				Knex('blogs').insert({vid: req.body.vid, name: req.body.name, artist: req.body.artist, director: req.body.director, text: req.body.text, date: req.body.stamp, artistLink: req.body.al, directorLink: req.body.dl});
			}
			res.send(200, {});
		});
}

exports.removeBlock = function(req, res) {
	Knex('song').where('vid',req.params.data).del();
	res.send(200, {});
}

exports.showList = function(req, res) {
	if(req.session.user) {
		Knex('songs').join('songs_playlists', 'songs_playlists.song_id','=','songs.id').where('songs_playlists.playlist_id','=',req.body.lid)
		.then(function(songs) {
			console.log(songs);
			Knex('playlists').where('id', req.body.lid)
			.then(function(list) {
				console.log(list);
				res.render('playlist', {list: songs, name: list[0].name, playlist_id: req.body.lid, session: req.session, order: list[0].the_order.split(',')}, function(err, model) {
					console.log(err);
					res.send({html: model});
				});
			});
		});
	}
}

exports.videoSearch = function(req, res) {

	var sql = 'SELECT DISTINCT songs.vid, name, artist, song_id, likes, created_at, pop_week, pop_1 FROM songs INNER JOIN songs_genres ON songs.id=songs_genres.song_id';

	if(req.body.sortParams == 'pop_week' || req.body.sortParams == 'pop_1') {
		sql += ' INNER JOIN popularity ON songs.vid=popularity.vid ';
	}

	var filter = req.body.filterParams.split(',');
	var wherestatement = ' WHERE';
	if(filter[0].length > 0) {
		for(var j = 0; j < filter.length; j++) {
			if(filter[j] == 'spotifyArtists') {
				sql += ' INNER JOIN spotify_artists ON songs.artist=spotify_artists.artist WHERE spotify_artists.spotify_id=' + req.session.spotifyID;
				wherestatement = ' AND';
			} 
		}
		for(var j = 0; j < filter.length; j++) {
			if(filter[j] != 'spotifyArtists') {
				sql += wherestatement + ' songs.' + filter[j] + "=1";
				wherestatement = ' AND';
			}
		}
	}

	if(req.body.genreParams > 0) {
		if(req.body.genreParams < 200) {
			sql += wherestatement + ' songs_genres.genre_1_id = ' + req.body.genreParams;
		} else if (req.body.genreParams >= 200) {
			sql += wherestatement + ' songs_genres.genre_2_id = ' + req.body.genreParams;
		}
	}

	sql += ' ORDER BY ' + req.body.sortParams + ' DESC LIMIT 75 OFFSET ' + req.body.offset;
	console.log(sql);
	Knex.raw(sql).then(function(m) {
		if(m[0]) {
			m = m[0];
		} else {
			m = m.rows;
		}
		console.log(m);
		res.render('songs', {songs: m, session: req.session}, function(err, model) {
				res.send({html: model, m: m});
			});
	});
}

exports.textVideoSearch = function(req,res) {
	var sql = " lower(songs.artist) LIKE '" + req.body.sval + "%' OR lower(songs.artist) LIKE '% " + req.body.sval + "%' OR lower(songs.name) LIKE '" + req.body.sval + "%' OR lower(songs.name) LIKE '% " + req.body.sval + "%'";
	Knex('songs').whereRaw(sql).offset(req.body.offset).limit(75)
		.then(function(m) {
			res.render('songs', {songs: m, session: req.session}, function(err, model) {
				res.send(200,{html: model});
			});
		});
}

exports.login = function(req, res) {
	Knex('users').where({username: req.body.user, password: req.body.password})
	.then(function(model) {
		req.session.user = req.body.user;
		req.session.userid = model[0].id;
		req.session.admin = model[0].admin;
		Knex('playlists').where('userid', req.session.userid)
		.then(function(m1) {
			console.log(m1);
			Knex('genres').distinct('genre_4')
			.then(function(genres) {
				res.render('myLists', {session: req.session, lists: m1, genres: genres}, function(err, m) {
					res.send({html: m, ses: req.session});
				});
			});
		}).catch(function(e) {
			res.send(400,{});
		});
	}).catch(function(e) {
		res.send(400,{});
	});
}

exports.getLoginNav = function(req, res) {
	Knex('playlists').where('userid',req.session.userid)
	.then(function(lists) {
		res.render('myListsNav', {user: req.session.user, lists: lists}, function(err, m) {
			res.send(200, {html: m});
		});
	});
}

exports.deleteSong = function(req, res) {
	Knex('songs_playlists').where({song_id: req.body.song_ID, playlist_id: req.body.lid}).del()
	.then(function() {
		Knex('playlists').where('id', req.body.lid).update('the_order', req.body.order)
		.then(function() {
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
	Knex('users').where({username: req.body.user, password: req.body.password})
	.then(function(model) {
		console.log(model);
		console.log(model.length);
		if(model.length != 0) {
			res.send(400, {});
		} else {
			Knex('users').insert({username: req.body.user, password: req.body.password, email: req.body.email})
			.then(function(m) {
				req.session.user = req.body.user;
				req.session.userid = m[0].id;
				req.session.admin = m[0].admin;
				Knex('genres').distinct('genre_4')
				.then(function(genres) {
					res.render('myLists', {session: req.session, lists: [], genres: genres}, function(err, m) {
						res.send({html: m, ses: req.session});
					});
				});
			})
		}
    });
}

exports.createList = function(req, res) {
	Knex('playlists').where({name: req.body.listName, userid: req.session.userid})
	.then(function(model) {
		if(model.length != 0) {
			res.send(400, {err: 'found model'});
		} else {
			Knex('playlists').insert({name: req.body.listName, userid: req.session.userid, the_order: ""}).returning('id')
			.then(function(m) {
				res.send(200,{m: {id: m[0], name: req.body.listName}});
			});
		}
	});
}

exports.deleteList = function(req, res) {
	Knex('playlists').where('id',req.body.listid).del()
	.then(function() {
		Knex('songs_playlists').where('playlist_id',req.body.listid).del()
		.then(function(songs) {
			res.send(200, {});
		});
	});
}

exports.updateListName = function(req, res) {
	Knex('playlists').where('id',req.body.lid).update('name', req.body.name)
	.then(function() {
		res.send(200,{});
	});
}

exports.addSong = function(req, res) {
	Knex('playlists').where('id',req.body.lid)
	.then(function(m) {
		var thumbnail = (m[0].thumbnail.length == 0 ? req.body.vid : m[0].thumbnail);
		var order = (m[0].the_order.length == 0 ? req.body.song_ID : m[0].the_order + ',' + req.body.song_ID);
		Knex('playlists').where('id',req.body.lid).update({thumbnail: thumbnail, the_order: order})
		.then(function() {
			Knex('songs_playlists').insert({song_id: req.body.song_ID, playlist_id: req.body.lid})
			.then(function() {
				res.send(200,{});
			});
		});
	}).catch(function(e) {
		res.send(400,{});
	});
}

exports.updateListOrder = function(req, res) {
	Knex('songs').where('id', req.body.order.split(',')[0])
	.then(function(song) {
		Knex('playlists').where('id', req.body.lid).update({thumbnail: song[0].vid, the_order: req.body.order})
		.then(function() {
			res.send(200, {});
		});
	}).catch(function(e) {
		res.send(400,{});
	});
}

exports.likeSong = function(req, res) {
	Knex('songs').where('vid',req.body.vid)
	.then(function(model) {
		var likes = parseInt(model[0].likes) + 1;
		Knex('songs').where('vid',req.body.vid).save({likes: likes},{patch: true})
		.then(function() {
			res.send(200, {});
		});
	}).catch(function(e) {
		res.send(400,{});
	});
}

exports.unlikeSong = function(req, res) {
	Knex('songs').where('vid',req.body.vid)
	.then(function(model) {
		var likes = parseInt(model[0].likes) - 1;
		Knex('songs').where('vid',req.body.vid).save({likes: likes},{patch: true})
		.then(function() {
			res.send(200, {});
		});
	}).catch(function(e) {
		res.send(400,{});
	});
}

exports.staffAdd = function(req, res) {
	Knex('songs').where('vid', req.body.vid)
	.then(function(model) {
		var staff = 1;
		Knex('songs').where('vid', req.body.vid).update({staff: staff},{patch: true})
		.then(function() {
			res.send(200, {});
		});
	}).catch(function(e) {
		res.send(400,{});
	});
}

exports.staffRemove = function(req, res) {
	Knex('songs').where('vid', req.body.vid)
	.then(function(model) {
		var staff = 0;
		Knex('songs').where('vid', req.body.vid).update({staff: staff},{patch: true})
		.then(function() {
			res.send(200, {});
		});
	}).catch(function(e) {
		res.send(400,{});
	});
}

exports.blogVideos = function(req, res) {
	Knex('blogs')
	.then(function(blogs) {
		res.render('featuredVideos', {blogs: blogs}, function(err, m) {
			res.send(200,{html: m});
		});
	});
}

exports.blogInterviews = function(req, res) {
	Knex('interviews')
	.then(function(blogs) {
		res.render('interviews', {blogs: blogs}, function(err, m) {
			res.send(200,{html: m});
		});
	});
}

exports.refreshGenres = function(req, res) {
	var masterGenre = 'genre_' + parseInt(req.body.count);
	var subGenre = 'genre_' + parseInt(req.body.count+1);
	if(req.body.genre == '*') {
		Knex('genres').distinct('genre_1','genre_1_id').select()
		.then(function(genres) {
			res.render('genres', {genres: genres, count: req.body.count}, function(err, m) {
				res.send(200,{html: m});
			});
		});
	} else {
		Knex('genres').distinct('genre_2','genre_2_id').whereRaw(masterGenre + " = '" + req.body.genre + "' AND NOT " + subGenre + " = ''")
		.then(function(genres) {
			res.render('genres', {genres: genres, count: req.body.count}, function(err, m) {
				res.send(200,{html: m});
			});
		});
	}
}

exports.newgenreUpdate = function(req, res) {
	Knex('songs_genres').del()
	.then(function(songGenres) {
		Knex('genres')
		.then(function(genres) {
			genres.forEach(function(genre) {
				var genreSQL = genre.genre_4.toLowerCase();
				Knex('songs').whereRaw("genre LIKE '%, " + genreSQL + ",%'")
				.then(function(songs) {
					songs.forEach(function(song) {
						console.log(song.id);
						Knex('songs_genres').insert({song_id: song.id, genre_1_id: genre.genre_1_id, genre_2_id: genre.genre_2_id})
						.then(function() {

						}).catch(function(e) {
							console.log(e);
						});
					});
				});
			});
			res.send(200,{});
		});
	});
}