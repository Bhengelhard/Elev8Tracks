var Playlist = require('../models/playlist');
var Song = require('../models/song');
var Blog = require('../models/blog');
var User = require('../models/user');
var blogInterview = require('../models/interview');
var Genre = require('../models/genre');
var songGenre = require('../models/song_genre');
var songList = require('../models/song_list');
var Knex = require('../init/knex');

exports.index = function(req, res) {
	Blog.collection().fetch()
		.then(function(blogs) {
			Playlist.collection().query(function(search) {
				search.where('userid', '=', req.session.userid);
			}).fetch()
			.then(function(lists) {
				Knex('genres').groupBy('genre_1')
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
			Knex('genres').groupBy('genre_1')
			.then(function(genres) {
				res.render('home', {spotify: req.session.spotifyID, blogs: m, genres: genres});
			});
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
	var genres = req.body.genre.split(',');
	var sql = '';
	for(var i = 0; i < genres.length; i++) {
		sql += "genre_final = '" + genres[i] + "' OR";
	}
	sql = sql.substring(0,sql.length-3);
	Genre.collection().query(function(search) {
		search.whereRaw(sql);
	}).fetch().then(function(genres) {
		var genre1 = '',
			genre2 = '',
			genre3 = '';
		genres.forEach(function(genre) {
			if(genre.attributes.genre_1.length > 0 && genre1.search(','+genre.attributes.genre_1+',') < 0)
				genre1 += genre.attributes.genre_1 + ',';
			if(genre.attributes.genre_2.length > 0 && genre2.search(','+genre.attributes.genre_2+',') < 0)
				genre2 += genre.attributes.genre_2 + ',';
			if(genre.attributes.genre_3.length > 0 && genre3.search(','+genre.attributes.genre_3+',') < 0)
				genre3 += genre.attributes.genre_3 + ',';
		});
		new Song({vid: req.body.vid}).fetch({require: true})
		.then(function(m) {
			m.save({vid: req.body.vid, name: req.body.name, artist: req.body.artist, genre: req.body.genre, director: req.body.director, genre1: genre1, genre2: genre2, genre3:genre3},{patch: true});
			res.send(200, {});
		}).catch(function(e) {
			new Song().save({vid: req.body.vid, name: req.body.name, artist: req.body.artist, created_at: time, genre1: genre1, genre2: genre2, genre3:genre3},{patch: true});
			res.send(200,{});
		});
	});
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
		Knex('songs').join('songs_playlists', 'songs_playlists.song_ID','=','songs.id').where('songs_playlists.playlist_ID','=',req.body.lid)
		.then(function(songs) {
			Knex('playlists').where('id', req.body.lid)
			.then(function(list) {
				res.render('playlist', {list: songs, name: list[0].name, playlist_ID: req.body.lid, session: req.session, order: list[0].the_order.split(',')}, function(err, model) {
					res.send({html: model});
				});
			});
		});
	}
}

exports.videoSearch = function(req, res) {
	// var sql = '(';
	// var sql2 = '(';
	// var search = req.body.searchParams.split(',');
	// for(var i = 0; i < search.length; i++) {
	// 	sql += " lower(songs." + search[i] + ") LIKE '" + req.body.sval + "%' OR";
	// 	sql += " lower(songs." + search[i] + ") LIKE '% " + req.body.sval + "%' OR";
	// }
	// sql = sql.substring(0, sql.length - 3) + ')';
	// var filter = req.body.filterParams.split(',');
	// var spotifyArtistFilter = 0;
	// var genres = req.body.genreParams.split(',');
	// console.log(genres);
	// if(genres[0].length > 0) {
	// 	for(var j = 0; j < genres.length; j++) {
	// 		var n = j + 1;
	// 		sql += " AND genre" + n + " LIKE '%," + genres[j] + ",%'";
	// 		sql += " AND genre" + n + " LIKE '%," + genres[j] + ",%'";
	// 	}
	// }
	var sql = 'SELECT * FROM songs INNER JOIN songs_genres ON songs.id=songs_genres.song_ID';

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
			sql += wherestatement + ' songs_genres.genre_1_ID = ' + req.body.genreParams;
		} else if (req.body.genreParams >= 200) {
			sql += wherestatement + ' songs_genres.genre_2_ID = ' + req.body.genreParams;
		}
	}

	sql += ' GROUP BY songs.id ORDER BY ' + req.body.sortParams + ' ASC LIMIT 75 OFFSET ' + req.body.offset;
	Knex.raw(sql).then(function(m) {
		res.render('songs', {songs: m[0], session: req.session}, function(err, model) {
				res.send({html: model});
			});
	});
	// 	var genreSql = (req.body.genreParams[0] == 1 ? 'songs_genres.genre_1_ID = ' + req.body.genreParams[1]: 'songs_genres.genre_2_ID = ' + req.body.genreParams[1]);
	// Knex('songs').join('songs_genres','songs.id','=','songs_genres.song_ID').whereRaw(genreSql).offset(req.body.offset).limit(req.body.limit).groupBy('songs.id').orderBy(req.body.sortParams, 'asc')
	// .then(function(m) {
	// 	res.render('songs', {songs: m, session: req.session}, function(err, model) {
	// 			res.send({html: model});
	// 		});
	// });
	// Knex('genres').whereRaw(genresql)
	// .then(function(genre) {
	// 	console.log(genre);

	// var order = (req.body.sortParams == 'likes' ? 'asc' : 'desc');
	// if(spotifyArtistFilter == 1) {
	// 	sql += " AND spotify_artists.spotify_id = " + req.session.spotifyID;
	// 	Knex('songs').join('spotify_artists','songs.artist','=','spotify_artists.artist').whereRaw(sql).offset(req.body.offset).limit(req.body.limit).orderBy(req.body.sortParams, 'asc')
	// 	.then(function(m) {
	// 		res.render('songs', {songs: m, session: req.session}, function(err, model) {
	// 			res.send({html: model});
	// 		});
	// 	});
	// } else {
	// 	Knex('songs').whereRaw(sql).offset(req.body.offset).limit(req.body.limit).orderBy(req.body.sortParams, order)
	// 	.then(function(m) {
	// 		res.render('songs', {songs: m, session: req.session}, function(err, model) {
	// 			res.send({html: model});
	// 		});
	// 	});
	// }

	// });
}

exports.textVideoSearch = function(req,res) {
	var sql = " lower(songs.artist) LIKE '" + req.body.sval + "%' OR lower(songs.artist) LIKE '% " + req.body.sval + "%' OR lower(songs.name) LIKE '" + req.body.sval + "%' OR lower(songs.name) LIKE '% " + req.body.sval + "%'";
	Knex('songs').whereRaw(sql).offset(req.body.offset).limit(req.body.limit)
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
		var lists = song.attributes.lists.replace(String(req.body.lid + ','), '');
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
		console.log('check');
		Knex('songs_playlists').where('playlist_ID',req.body.listid).del()
		.then(function(songs) {
			res.send(200, {});
		});
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
		console.log(m.attributes);
		 var thumbnail = (m.attributes.thumbnail.length == 0 ? req.body.vid : m.attributes.thumbnail);
		var order = (m.attributes.the_order.length == 0 ? req.body.song_ID : m.attributes.the_order + ',' + req.body.song_ID);
		console.log(thumbnail);
		console.log(order);
		m.save({thumbnail: thumbnail, the_order: order}, {patch: true});
		new Song({vid: req.body.vid}).fetch({require: true})
			.then(function(song) {
				var lists = (song.attributes.lists.length == 0 ? ',' + req.body.lid + ',' : song.attributes.lists + req.body.lid + ',');
				song.save({lists: lists}, {patch: true});
				res.send(200, {});
			});
		new songList().save({song_ID: req.body.song_ID, playlist_ID: req.body.lid});
	}).catch(function(e) {
		res.send(400,{});
	});
}

exports.updateListOrder = function(req, res) {
	new Playlist({id: req.body.lid}).fetch({require: true})
	.then(function(m) {
		Knex('songs').where('id', req.body.order.split(',')[0])
		.then(function(song) {
			m.save({thumbnail: song[0].vid, the_order: req.body.order},{patch: true});
			res.send(200, {});
		});
	}).catch(function(e) {
		res.send(400,{});
	});
}

exports.likeSong = function(req, res) {
	new Song({vid: req.body.vid}).fetch({require: true})
	.then(function(model) {
		var likes = parseInt(model.attributes.likes) + 1;
		model.save({likes: likes},{patch: true});
		res.send(200, {});
	}).catch(function(e) {
		res.send(400,{});
	});
}

exports.unlikeSong = function(req, res) {
	new Song({vid: req.body.vid}).fetch({require: true})
	.then(function(model) {
		var likes = parseInt(model.attributes.likes) - 1;
		model.save({likes: likes},{patch: true});
		res.send(200, {});
	}).catch(function(e) {
		res.send(400,{});
	});
}

exports.staffAdd = function(req, res) {
	new Song({vid: req.body.vid}).fetch({require: true})
	.then(function(model) {
		var staff = 1;
		model.save({staff: staff},{patch: true});
		res.send(200, {});
	}).catch(function(e) {
		res.send(400,{});
	});
}

exports.staffRemove = function(req, res) {
	new Song({vid: req.body.vid}).fetch({require: true})
	.then(function(model) {
		var staff = 0;
		model.save({staff: staff},{patch: true});
		res.send(200, {});
	}).catch(function(e) {
		res.send(400,{});
	});
}

exports.blogVideos = function(req, res) {
	Blog.collection().fetch()
		.then(function(blogs) {
			res.render('featuredVideos', {blogs: blogs}, function(err, m) {
				res.send(200,{html: m});
			});
		});
}

exports.blogInterviews = function(req, res) {
	blogInterview.collection().fetch()
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
		Knex('genres').groupBy('genre_1')
		.then(function(genres) {
			res.render('genres', {genres: genres, count: req.body.count}, function(err, m) {
				res.send(200,{html: m});
			});
		});
	} else {
		Knex('genres').whereRaw(masterGenre + " = '" + req.body.genre + "' AND NOT " + subGenre + ' = ""').groupBy(subGenre)
		.then(function(genres) {
			res.render('genres', {genres: genres, count: req.body.count}, function(err, m) {
				res.send(200,{html: m});
			});
		});
	}
}

exports.genreUpdate = function(req, res) {
	Genre.collection().fetch()
	.then(function(genres) {
		var genreArray = [];
		genres.forEach(function(genre) {
			genreArray.push(genre.attributes);
		// 	Song.collection().query(function(search) {
		// 		search.whereRaw("genre LIKE '%, " + genre.attributes.genre_final + ",%'");
		// 	}).fetch().then(function(songs) {
		// 		songs.forEach(function(song) {
		// 			var genre1 = song.attributes.top_genre + genre.attributes.genre1 + ',';
		// 			console.log(genre1);
		// 			var genre2 = (genre.attributes.genre2.length > 0 ? genre.attributes.genre2 + ',':'');
		// 			var genre3 = (genre.attributes.genre3.length > 0 ? genre.attributes.genre3 + ',':'');
		// 			song.save({top_genre: genre1});

		// 		});
		// 	});
		});
		genreUpdateQuery(genreArray, 0);
		res.send(200,{});
	});
	// Knex('genres').where('genre_final',req.body.genre)
	// .then(function(genre1) {
	// 	res.send(200,{});
	// });
}

function genreUpdateQuery(genres, n) {
	if(n < genres.length) {
		Song.collection().query(function(search) {
			search.whereRaw("genre LIKE '%, " + genres[n].genre_4 + ",%'");
		}).fetch().then(function(songs) {
			songs.forEach(function(song) {
				if(song.attributes.genre1.search(',' + genres[n].genre_1 + ',') >= 0) {
					var genre1 = song.attributes.genre1;
				} else {
					var genre1 = song.attributes.genre1 + genres[n].genre_1 + ',';
				}
				var genre2 = ((genres[n].genre_2.length > 1 && song.attributes.genre2.search(',' + genres[n].genre_2 + ',') < 0) ? genres[n].genre_2 + ',':'');
				var genre3 = ((genres[n].genre_3.length > 1 && song.attributes.genre3.search(',' + genres[n].genre_3 + ',') < 0) ? genres[n].genre_3 + ',':'');
				song.save({genre1: genre1, genre2: song.attributes.genre2 + genre2, genre3: song.attributes.genre3 + genre3 })
				.then(function() {
					genreUpdateQuery(genres, n++);
				});
			});
		});
	} else {
		console.log('done');
	}
}

exports.newgenreUpdate = function(req, res) {
	songGenre.collection().fetch()
	.then(function(songGenres) {
		songGenres.destroy();
		Genre.collection().fetch()
		.then(function(genres) {
			genres.forEach(function(genre) {
				Song.collection().query(function(search) {
					search.whereRaw("genre LIKE '%, " + genre.attributes.genre_4 + ",%'");
				}).fetch().then(function(songs) {
					songs.forEach(function(song) {
						new songGenre({song_ID: song.attributes.id, genre_1_ID: genre.attributes.genre_1_ID, genre_2_ID: genre.attributes.genre_2_ID}).save();
					});
				});
			});
			res.send(200,{});
		});
	})
}