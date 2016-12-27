var Knex = require('../init/knex');
var request = require('request'); // "Request" library

exports.index = function(req, res) {
	Knex('blogs').orderBy('date', 'desc').join('songs','songs.vid', '=', 'blogs.vid')
		.then(function(blogs) {
			console.log(blogs);
			Knex('playlists').where('userid', req.session.userid)
			.then(function(lists) {
				var sql = "Select genre, count(*) as count from artists_genres group by genre order by count(*) desc limit(5)";
				Knex('genres_master').distinct('mastergenre','mastergenre_id').select()
				.then(function(genres) {
					console.log(genres);
					if(req.session.spotifyID) {
						if(req.session.imported) {
							Knex('spotify_playlists').where('spotify_id', req.session.spotifyID)
							.then(function(spotifyLists) {
								res.render('index', {blogs: blogs, user: req.session.user, spotify: req.session.spotifyID, lists: lists, genres: genres, spotifyLists: spotifyLists, count: 0, user_id: req.session.userid, admin: req.session.admin});
							});
						} else {
							res.render('index', {blogs: blogs, user: req.session.user, spotify: req.session.spotifyID, lists: lists, genres: genres, spotifyLists: 1, count: 0, user_id: req.session.userid, admin: req.session.admin});
						}
					} else {
						res.render('index', {blogs: blogs, user: req.session.user, spotify: req.session.spotifyID, lists: lists, genres: genres, spotifyLists: 0, count: 0, user_id: req.session.userid, admin: req.session.admin});
					}
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
			res.render('index', {songs: m, session: req.session});
		});
}

exports.songsViewTrending = function(req, res) {
	Knex('songs').join('popularity', 'songs.vid', '=', 'popularity.vid').orderBy('pop_trending', 'desc').limit(75)
		.then(function(songs) {
			Knex('playlists').where('userid', req.session.userid)
			.then(function(lists) {
				Knex('genres').distinct('genre_1','genre_1_id').select()
				.then(function(genres) {
					res.render('indexSongs', {songs: songs, session: req.session, user: req.session.user, user_id: req.session.userid, spotify: req.session.spotifyID, lists: lists, genres: genres, count: 0});
				});
			});
		});
}

exports.songsViewTrendingPlay = function(req, res) {
	Knex('songs').where('vid','=',req.params.vid)
	.then(function(play) {
		Knex('songs').join('popularity', 'songs.vid', '=', 'popularity.vid').orderBy('pop_trending', 'desc').limit(75)
			.then(function(songs) {
				Knex('playlists').where('userid', req.session.userid)
				.then(function(lists) {
					Knex('genres').distinct('genre_1','genre_1_id').select()
					.then(function(genres) {
						res.render('indexSongsPlay', {songs: songs, play: play, session: req.session, user: req.session.user, user_id: req.session.userid, spotify: req.session.spotifyID, lists: lists, genres: genres, count: 0});
					});
				});
			});
	});
}

exports.blogPlay = function(req, res) {
	Knex('blogs').orderBy('date', 'desc').join('songs','songs.vid', '=', 'blogs.vid')
		.then(function(blogs) {
			Knex('blogs').where('blogs.vid', '=', req.params.vid).join('songs','songs.vid', '=', 'blogs.vid')
			.then(function(play) {
				var description = play[0].text.substring(0,200) + "...";
				Knex('playlists').where('userid', req.session.userid)
				.then(function(lists) {
					Knex('genres').distinct('genre_1','genre_1_id').select()
					.then(function(genres) {
						if(req.session.spotifyID) {
							if(req.session.imported) {
								Knex('spotify_playlists').where('spotify_id', req.session.spotifyID)
								.then(function(spotifyLists) {
									res.render('indexBlogsPlay', {play: play, description: description, blogs: blogs, user: req.session.user, spotify: req.session.spotifyID, lists: lists, genres: genres, spotifyLists: spotifyLists, count: 0, user_id: req.session.userid, admin: req.session.admin});
								});
							} else {
								res.render('indexBlogsPlay', {play: play, description: description, blogs: blogs, user: req.session.user, spotify: req.session.spotifyID, lists: lists, genres: genres, spotifyLists: 1, count: 0, user_id: req.session.userid, admin: req.session.admin});
							}
						} else {
							res.render('indexBlogsPlay', {play: play, description: description, blogs: blogs, user: req.session.user, spotify: req.session.spotifyID, lists: lists, genres: genres, spotifyLists: 0, count: 0, user_id: req.session.userid, admin: req.session.admin});
						}
					});
				});
			});
		});
}

exports.blogs = function(req, res) {
	Knex('blogs').orderBy('date', 'desc').join('songs','songs.vid', '=', 'blogs.vid')
		.then(function(m) {
			Knex('genres').distinct('genre_1','genre_1_id').select()
			.then(function(genres) {
				res.render('home', {spotify: req.session.spotifyID, blogs: m, genres: genres, admin: req.session.admin});
			});
		});
}
exports.myLists = function(req, res) {
	if(req.session.user) {
		Knex('playlists').where('userid',req.session.userid)
		.then(function(lists) {
			Knex('genres').distinct('genre_4').orderBy('genre_4', 'asc')
			.then(function(genres) {
				Knex('followed_playlists').where({user_id: req.session.userid}).join('playlists', 'playlists.id', '=', 'followed_playlists.playlist_id').where({public: 1})
				.then(function(followed) {
					Knex('followed_artists').where({user_id: req.session.userid}).join('artists','artists.id', '=', 'followed_artists.artist_id')
					.then(function(followed_artists) {
						res.render('myLists', {session: req.session, lists: lists, genres: genres, spotify: req.session.spotifyID, followed: followed, followed_artists: followed_artists}, function(err, m) {
							res.send({html: m, ses: req.session});
						});
					});
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
	var genre_4 = req.body.genre.split(', ');
	var sql = '';
	for(var i = 0; i < genre_4.length; i++) {
		sql += "lower(genre_4) LIKE '" + genre_4[i] + "' OR ";
	}
	sql = sql.substring(0,sql.length-4);
	console.log(sql);
	Knex('genres').whereRaw(sql)
	.then(function(genres) {
		console.log(genres);
		Knex('songs').where('vid', req.body.vid)
		.then(function(song) {
			var n = 0;
			if(song.length != 0) {
				Knex('songs').where('vid', req.body.vid).update({vid: req.body.vid, name: req.body.name, artist: req.body.artist, genre: req.body.genre, spotify_id: req.body.spotify_id, spotify_pop: req.body.pop, updated_at: time, energy: req.body.energy, danceability: req.body.danceability, key: req.body.key, loudness: req.body.loudness, mode: req.body.mode, speechiness: req.body.speechiness, acousticness: req.body.acousticness, instrumentalness: req.body.instrumentalness, liveness: req.body.liveness, valence: req.body.valence, tempo: req.body.tempo});
				createArtist(req.body.artist, req.body.artist_id, req.body.vid);
				Knex('songs_genres').where('song_id',song[0].id).del()
				.then(function(song_genres) {
					genres.forEach(function(genre) {
						Knex('songs_genres').insert({song_id: song[0].id, genre_1_id: genre.genre_1_id, genre_2_id: genre.genre_2_id})
						.then(function() {
							Knex('spotify_match').where('song_id',song[0].id).del()
							.then(function() {
								var spotify_ids = [];
								console.log(req.body.spotify_ids);
								for(var i = 0; i < req.body.spotify_ids.length; i++) {
									spotify_ids.push({song_id: song[0].id, spotify_id: req.body.spotify_ids[i]});
									Knex('spotify_songs_playlists').where('spotify_id', req.body.spotify_ids[i]).update({song_id: song[0].id})
									.then(function() {
										console.log('matched');
									});
								}
								Knex('spotify_match').insert(spotify_ids)
                          		.then(function() {
                          			console.log('updated');
                           		});
							});
						});
					});
				})
			} else {
				Knex('songs').insert({vid: req.body.vid, name: req.body.name, artist: req.body.artist, genre: req.body.genre, spotify_id: req.body.spotify_id, spotify_pop: req.body.pop, created_at: time, energy: req.body.energy, danceability: req.body.danceability, key: req.body.key, loudness: req.body.loudness, mode: req.body.mode, speechiness: req.body.speechiness, acousticness: req.body.acousticness, instrumentalness: req.body.instrumentalness, liveness: req.body.liveness, valence: req.body.valence, tempo: req.body.tempo})
				.then(function() {
					//createArtist(req.body.artist, req.body.artist_id, req.body.vid);


					Knex('artists').where('spotify_id', req.body.artist_id)
						.then(function(oldArtist) {
							console.log(oldArtist);
							if(oldArtist[0]) {oldArtist=oldArtist[0]}
							else if(oldArtist.rows) {oldArtist = oldArtist.rows}
							if(oldArtist.length != 0) {
								var artist_id = oldArtist.id;
								updateSongArtist(req.body.artist, artist_id, req.body.vid);
							} else {
								console.log('--new artist');
								Knex('artists').insert({name: req.body.artist, spotify_id: req.body.artist_id, thumbnail: req.body.vid})
								.then(function() {
									Knex('artists').where({spotify_id: req.body.artist_id})
									.then(function(newArtist) {
										console.log(newArtist);
										if(newArtist[0]) {newArtist=newArtist[0]}
										var artist_id = newArtist.id;
										updateSongArtist(req.body.artist, artist_id, req.body.vid);
									});
								});
							}
					});


					Knex('popularity').insert({vid: req.body.vid})
					.then(function() {
						Knex('songs').where('vid', req.body.vid)
						.then(function(song) {
							genres.forEach(function(genre) {
								Knex('songs_genres').insert({song_id: song[0].id, genre_1_id: genre.genre_1_id, genre_2_id: genre.genre_2_id})
								.then(function() {
									var spotify_ids = [];
									console.log(req.body.spotify_ids);
									for(var i = 0; i < req.body.spotify_ids.length; i++) {
										spotify_ids.push({song_id: song[0].id, spotify_id: req.body.spotify_ids[i]});
										Knex('spotify_songs_playlists').where('spotify_id', req.body.spotify_ids[i]).update({song_id: song[0].id})
										.then(function() {
											console.log('matched');
										});
									}
									Knex('spotify_match').insert(spotify_ids)
                              		.then(function() {
                              			console.log('inserted');
                              		});
								});
							});
						});
					});
				});
			}
		});
	});
	res.send(200,{});
}

function createArtist(artist, spotify_id, vid) {
	Knex('artists').where('spotify_id', spotify_id)
		.then(function(oldArtist) {
			console.log(oldArtist);
			if(oldArtist[0]) {oldArtist=oldArtist[0]}
			else if(oldArtist.rows) {oldArtist = oldArtist.rows}
			if(oldArtist.length != 0) {
				var artist_id = oldArtist.id;
				updateSongArtist(artist, artist_id, vid);
			} else {
				Knex('artists').orderBy('id','desc').limit(10)
				.then(function(existing) {
					if(oldArtist[0]) {oldArtist=oldArtist[0]}
					else if(oldArtist.rows) {oldArtist = oldArtist.rows}
				})
				Knex('artists').insert({name: artist, spotify_id: spotify_id, thumbnail: vid})
				.then(function() {
					Knex('artists').where({spotify_id: spotify_id})
					.then(function(newArtist) {
						if(newArtist[0]) {newArtist=newArtist[0]}
						var artist_id = newArtist.id;
						updateSongArtist(artist, artist_id, vid);
					});
				});
			}
	});
}
function updateSongArtist(artist, artist_id, vid) {
	console.log(vid);
	console.log(artist_id);
	Knex('songs').where('vid', vid).update({artist_id: artist_id})
	.then(function() {
		var url = 'https://api.spotify.com/v1/search?q=' + encodeURIComponent(artist) + '&limit=10&type=artist';
              request.get(url, function(error, data, body) {
		          var response = JSON.parse(body);
		          if(response.artists && response.artists.items && response.artists.items[0]) {
		                var genres = '';
		                response.artists.items[0].genres.forEach(function(genre) {
		                  Knex('artists_genres').insert({artist_id: artist_id, genre: genre})
		                  .then(function(){});
		                });
		          }
          	  });
	});
}

exports.storeBlog = function(req, res) {
	Knex('songs').where('vid', req.body.vid)
	.then(function(song) {
		console.log('******');
		console.log(song);
		if(song[0]) {song = song[0]}
		else if(song.rows) {song = song.rows}
		Knex('blogs').where('vid',req.body.vid)
		.then(function(m) {
			console.log(m);
			if(m.length != 0) {
				Knex('blogs').where('vid',req.body.vid).update({vid: req.body.id, name: req.body.name, artist: req.body.artist, director: req.body.director, text: req.body.text, date: req.body.stamp, artistLink: req.body.al, directorLink: req.body.dl, song_id: song.id, artist_id: song.artist_id})
				.then(function() {
					res.send(200, {});
				}).catch(function(err) {
					console.log(err);
				});
			} else {
				Knex('blogs').insert({vid: req.body.vid, name: req.body.name, artist: req.body.artist, director: req.body.director, text: req.body.text, date: req.body.stamp, artistLink: req.body.al, directorLink: req.body.dl, song_id: song.id, artist_id: song.artist_id})
				.then(function() {
					res.send(200, {});
				}).catch(function(err) {
					console.log(err);
				});			
			}
		});
	});
}

exports.removeBlock = function(req, res) {
	Knex('songs').where('id',req.body.song_id).limit(1).del()
	.then(function() {
		Knex('spotify_songs_playlists').where('song_id',req.body.song_id).del()
		.then(function() {
			Knex('spotify_match').where('song_id', req.body.song_id).del()
			.then(function() {
				Knex('songs_playlists').where('song_id', req.body.song_id).del()
				.then(function() {
					Knex('songs_genres').where('song_id', req.body.song_id).del()
					.then(function() {
						Knex('popularity').where('vid', req.body.vid).del()
						.then(function() {
							Knex('blogs').where('vid', req.body.vid).del()
							.then(function() {
								res.send(200, {});
							});
						});
					});
				});
			});
		});
	});
}

exports.showList = function(req, res) {
		Knex('songs').join('songs_playlists', 'songs_playlists.song_id','=','songs.id').where('songs_playlists.playlist_id','=',req.body.lid).orderBy('songs_playlists.entry','asc')
		.then(function(songs) {
			console.log(songs);
			Knex('playlists').where('id', req.body.lid)
			.then(function(list) {
				console.log(songs);
				if(req.session.userid) {
					Knex('followed_playlists').where({user_id: req.session.userid, playlist_id: req.body.lid})
					.then(function(n) {
						if(n[0]) {n=n[0]}
						else if(n.rows) {n = n.rows}
						if(n.user_id)
							var follow = 1;
						else
							var follow = 0;
						res.render('playlist', {list: songs, name: list[0].name, playlist_id: req.body.lid, session: req.session, user_id: req.body.user_id, back: req.body.back, public: list[0].public, follow: follow}, function(err, model) {
							console.log(err);
							console.log(model);
							res.send({html: model});
						});
					});
				} else {
					res.render('playlist', {list: songs, name: list[0].name, playlist_id: req.body.lid, session: req.session, user_id: req.body.user_id, back: req.body.back, public: list[0].public, follow: 0}, function(err, model) {
						console.log(err);
						console.log(model);
						res.send({html: model});
					});
				}
			});
		});
}

exports.artistSearch = function(req, res) {
	console.log('artist search');
	Knex('songs').where('artist', req.body.artist)
	.then(function(m) {
		if(req.session.userid) {
			console.log(req.body.artist_id);
			console.log(req.session.userid);
			Knex('followed_artists').where({user_id: req.session.userid, artist_id: req.body.artist_id})
			.then(function(n) {
				if(n[0]) {n=n[0]}
				else if(n.rows) {n = n.rows}
				if(n.user_id)
					var follow = 1;
				else
					var follow = 0;
				Knex('artists').where('id',req.body.artist_id)
				.then(function(artist) {
					if(artist[0]) {artist=artist[0]}
					else if(artist.rows) {artist = artist.rows}
					console.log(req.body.artist_id);
					var sql = "select c.id, c.name, c.thumbnail, count(*) as count from (select distinct genre from artists_genres where artist_id = "+req.body.artist_id+") a join artists_genres b  on a.genre = b.genre join artists c on b.artist_id = c.id group by c.id, c.name, c.thumbnail having count(*) >= 6 order by count desc limit 16";
					console.log(sql);
					Knex.raw(sql)
					.then(function(related) {
						console.log(related);
						if(related[0]) {related=related[0]}
						if(related.rows) {related=related.rows}
						res.render('artist', {list: m, name: req.body.artist, artist_id: req.body.artist_id, session: req.session, follow: follow, related: related}, function(err, model) {
							res.send({html: model});
						});
					});
				});
			})
		} else {
			Knex('artists').where('id',req.body.artist_id)
				.then(function(artist) {
					if(artist[0]) {artist=artist[0]}
					else if(artist.rows) {artist = artist.rows}
					console.log(artist);
					var sql = "select c.id, c.name, c.thumbnail, count(*) as count from (select distinct genre from artists_genres where artist_id = "+req.body.artist_id+") a join artists_genres b  on a.genre = b.genre join artists c on b.artist_id = c.id group by c.id, c.name, c.thumbnail having count(*) >= 6 order by count desc limit 16";
					console.log(sql);
					Knex.raw(sql)
					.then(function(related) {
						console.log(related);
						if(related[0]) {related=related[0]}
						if(related.rows) {related=related.rows}
						res.render('artist', {list: m, name: req.body.artist, artist_id: req.body.artist_id, session: req.session, follow: 0, related: related}, function(err, model) {
							res.send({html: model});
						});
					});
				});
		}
	})
}

exports.videoSearch = function(req, res) {

	if(req.body.audio != 0) {
		var audio = ', ' + req.body.audio[0];
		var audioSearch = ' AND ' + req.body.audio[1];
	} else {
		var audio = '';
		var audioSearch = '';
	}

	var sql = 'SELECT DISTINCT songs.id, songs.vid, songs.name, songs.artist, songs.likes, songs.artist_id, songs.created_at, songs.staff, pop_week, pop_trending, pop_1' + audio + ' FROM songs INNER JOIN artists_genres ON songs.artist_id=artists_genres.artist_id';

	sql += ' INNER JOIN popularity ON songs.vid=popularity.vid ';

	if(req.body.searchParams == 'artist')
		sql += ' INNER JOIN artists ON songs.artist_id=artists.id ';

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

	if(req.body.searchParams == 'artist')
		sql += ' AND songs.artist_id='+req.body.sval;

	sql += audioSearch;

	if(req.body.genreParams > 0) {
		// if(req.body.genreParams < 200) {
		// 	sql += wherestatement + ' songs_genres.genre_1_id = ' + req.body.genreParams;
		// } else if (req.body.genreParams >= 200) {
		// 	sql += wherestatement + ' songs_genres.genre_2_id = ' + req.body.genreParams;
		// }
		sql += wherestatement + ' artists_genres.mastergenre_id = ' + req.body.genreParams;
	}

	sql += ' ORDER BY ' + req.body.sortParams + ' DESC LIMIT 75 OFFSET ' + req.body.offset;
	console.log(sql);
	Knex.raw(sql).then(function(m) {
		if(m[0]) {
			m = m[0];
		} else {
			m = m.rows;
		}
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
		req.session.userid = decodeURIComponent(model[0].id);
		req.session.admin = decodeURIComponent(model[0].admin);
		Knex('playlists').where('userid', req.session.userid)
		.then(function(m1) {
			Knex('genres').distinct('genre_4').orderBy('genre_4', 'asc')
			.then(function(genres) {
				Knex('followed_playlists').where({user_id: req.session.userid}).join('playlists', 'playlists.id', '=', 'followed_playlists.playlist_id').where({public: 1})
				.then(function(followed) {
					Knex('followed_artists').where({user_id: req.session.userid}).join('artists','artists.id', '=', 'followed_artists.artist_id')
					.then(function(followed_artists) {
						res.render('myLists', {session: req.session, lists: m1, genres: genres, spotify: req.session.spotifyID, followed: followed, followed_artists: followed_artists}, function(err, m) {
							res.send({html: m, ses: req.session});
						});
					});
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
		console.log(req.session.userid);
		res.render('myListsNav', {user: req.session.user, lists: lists, user_id: req.session.userid}, function(err, m) {
			res.send(200, {html: m});
		});
	});
}

// exports.deleteSong = function(req, res) {
// 	Knex('songs_playlists').where({song_id: req.body.song_ID, playlist_id: req.body.lid}).del()
// 	.then(function() {
// 		Knex('playlists').where('id', req.body.lid).update('the_order', req.body.order)
// 		.then(function() {
// 			res.send(200, {});
// 		});
// 	})
// }

exports.logout = function(req, res) {
	req.session.destroy();
	req.session = null;
	req.logout();
	res.render('login', {}, function(err, m) {
		res.send({html: m});
	});
}

exports.signUp = function(req, res) {
	Knex('users').where({username: req.body.user, password: req.body.password})
	.then(function(model) {
		if(model.length != 0) {
			res.send(400, {});
		} else {
			console.log(req.body.user);
			Knex('users').insert({username: req.body.user, password: req.body.password, email: req.body.email})
			.then(function(m) {
				Knex('users').where({username: req.body.user, password: req.body.password})
				.then(function(user) {
					console.log('-----');
					console.log(user);
					if(user[0]) {
		                user = user[0];
		              } else if(user.rows) {
		                user = user.rows;
		              }
		            console.log(user);
					req.session.user = decodeURIComponent(req.body.user);
					req.session.userid = decodeURIComponent(user.id);
					req.session.admin = decodeURIComponent(user.admin);
					Knex('playlists').insert({name:'Likes', userid: decodeURIComponent(user.id), public: 0})
					.then(function() {
						res.send(200, {});
					});
				});
			});
		}
    });
}

exports.createList = function(req, res) {
	Knex('playlists').where({name: req.body.listName, userid: req.session.userid})
	.then(function(model) {
		if(model.length != 0) {
			res.send(400, {err: 'found model'});
		} else {
			Knex('playlists').insert({name: req.body.listName, userid: req.session.userid, the_order: "", public: req.session.admin}).returning('id')
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
exports.updateBlogText = function(req, res) {
	Knex('blogs').where('id',req.body.bid).update('text', req.body.name)
	.then(function() {
		res.send(200,{});
	});
}
exports.updateInterviewText = function(req, res) {
	Knex('interviews').where('id',req.body.bid).update('text', req.body.name)
	.then(function() {
		res.send(200,{});
	});
}

exports.addSong = function(req, res) {
	console.log(req.body.lid);
	console.log(req.body.vid);
	console.log(req.body.song_ID);
	Knex('playlists').where('id',req.body.lid)
	.then(function(m) {
		console.log('FOUND');
		if(m[0]) {m=m[0]}
		else if(m.rows) {m = m.rows}
		console.log(m.thumbnail);
		console.log(m);
		var thumbnail = (m.thumbnail == null ? req.body.vid : m.thumbnail);
		console.log(thumbnail);
		Knex('playlists').where('id',req.body.lid).update({thumbnail: thumbnail})
		.then(function() {
			Knex('songs_playlists').where({playlist_id: req.body.lid}).orderBy('entry', 'desc')
			.then(function(n) {
				if(n[0]) {n=n[0]}
				else if(n.rows) {n = n.rows}
				if(n.id)
					var orderNo = n.entry + 1;
				else
					var orderNo = 0;
				console.log('ADDING');
				console.log(orderNo);
				Knex('songs_playlists').insert({song_id: req.body.song_ID, playlist_id: req.body.lid, entry: orderNo})
				.then(function() {
					console.log('ADDED');
					res.send(200,{});
				});
			});
		});
	}).catch(function(e) {
		res.send(400,{});
	});
}

exports.updateListOrder = function(req, res) {
	Knex('songs').where('id', req.body.order[0])
	.then(function(song) {
		Knex('playlists').where('id', req.body.lid).update({thumbnail: song[0].vid})
		.then(function() {
			Knex('songs_playlists').where({playlist_id: req.body.lid}).del()
			.then(function() {
				orderUpdate(req.body.lid, req.body.order, 0);
			});
			res.send(200, {});
		});
	}).catch(function(e) {
		res.send(400,{});
	});
}

function orderUpdate(playlist_id, order, n) {
	console.log('ordering');
	if(n < order.length) {
		Knex('songs_playlists').where({ playlist_id: playlist_id, song_id: order[n]}).insert({ playlist_id: playlist_id, song_id: order[n], entry: n})
		.then(function() {
			n = n+1;
			orderUpdate(playlist_id, order, n);
		});
	} 
}

// exports.likeSong = function(req, res) {
// 	if(req.session.userid) {
// 		Knex('playlists').where({user_id: req.session.userid, name: 'Likes'})
// 		.then(function(m) {
// 			if(m[0]) {m = m[0]}
// 			else if (m.rows) {m=m.rows}
// 			Knex('songs_playlists').insert({song_id: req.body.song_id, playlist_id: m.id})
// 			.then(function() {

// 			});
// 		});
// 	}
// 	res.send(200,{});
// }

// exports.unlikeSong = function(req, res) {
// 	if(req.session.userid) {
// 		Knex('playlists').where({user_id: req.session.userid, name: 'Likes'})
// 		.then(function(m) {
// 			if(m[0]) {m = m[0]}
// 			else if (m.rows) {m=m.rows}
// 			Knex('songs_playlists').where({song_id: req.body.song_id, playlist_id: m.id}).del()
// 			.then(function() {

// 			});
// 		});
// 	}
// 	res.send(200,{});
// }

exports.staffAdd = function(req, res) {
	Knex('songs').where('vid', req.body.vid).update({staff: 1})
	.then(function() {
		res.send(200, {});
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
	Knex('blogs').orderBy('date', 'desc').join('songs','songs.vid', '=', 'blogs.vid')
	.then(function(blogs) {
		console.log(blogs);
		res.render('featuredVideos', {blogs: blogs, admin: req.session.admin}, function(err, m) {
			res.send(200,{html: m});
		});
	});
}

exports.blogInterviews = function(req, res) {
	Knex('interviews').orderBy('created_at', 'desc')
	.then(function(blogs) {
		res.render('interviews', {blogs: blogs, admin: req.session.admin}, function(err, m) {
			res.send(200,{html: m});
		});
	});
}

exports.refreshGenres = function(req, res) {
	var mastergenre = 'genre_' + parseInt(req.body.count);
	var subGenre = 'genre_' + parseInt(req.body.count+1);
	if(req.body.genre == '*') {
		Knex('genres').distinct('genre_1','genre_1_id').select()
		.then(function(genres) {
			res.render('genres', {genres: genres, count: req.body.count}, function(err, m) {
				res.send(200,{html: m});
			});
		});
	} else {
		Knex('genres').distinct('genre_2','genre_2_id').whereRaw(mastergenre + " = '" + req.body.genre + "' AND NOT " + subGenre + " = ''")
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

exports.newGenreUpdate2 = function(req, res) {

}

exports.playlistSongDelete = function(req, res) {
	Knex('songs_playlists').where({song_id: req.body.song_id, playlist_id: req.body.list_id}).limit(1)
	.then(function(m) {
		if(m[0]) {m=m[0]}
		else if(m.rows) {m = m.rows}
		Knex('songs_playlists').where('id',m.id).del()
		.then(function() {
			Knex('playlists').where('id', req.body.list_id)
			.then(function(list) {
				if(list[0]) {list = list[0]}
				else if(list.rows) {list = list.rows}
				var listOrder = list.the_order.replace(req.body.song_id+',','');
				Knex('playlists').where('id', req.body.list_id).update({the_order: listOrder})
				.then(function() {
					res.send(200,{});
				});
			});
		});
	});
}

exports.playlistsSearch = function(req, res) {
	Knex('playlists').where('public', '1')
	.then(function(lists) {
		res.render('lists', {lists: lists}, function(err, m) {
			console.log(m);
			res.send(200,{html: m});
		});
	});
}

exports.makePublic = function(req, res) {
	Knex('playlists').where('id', req.body.lid).update('public',req.body.public)
	.then(function() {
		res.send(200,{});
	});
}

exports.followList = function(req, res) {
	if(req.session.user) {
		Knex('followed_playlists').insert({user_id: req.session.userid, playlist_id: req.body.lid})
		.then(function() {
			res.send(200,{});
		});
	} else {
		res.render('login', {}, function(err, m) {
			res.send({html: m});
		});
	}
}

exports.unfollowList = function(req, res) {
	if(req.session.user) {
		Knex('followed_playlists').where({user_id: req.session.userid, playlist_id: req.body.lid}).del()
		.then(function() {
			res.send(200,{});
		});
	} else {
		res.render('login', {}, function(err, m) {
			res.send({html: m});
		});
	}
}

exports.followArtist = function(req, res) {
	if(req.session.user) {
		Knex('followed_artists').insert({user_id: req.session.userid, artist_id: req.body.artist_id})
		.then(function() {
			res.send(200,{});
		});
	} else {
		res.render('login', {}, function(err, m) {
			res.send({html: m});
		});
	}
}
exports.unfollowArtist = function(req, res) {
	if(req.session.user) {
		Knex('followed_artists').where({user_id: req.session.userid, artist_id: req.body.artist_id}).del()
		.then(function() {
			res.send(200,{});
		});
	} else {
		res.render('login', {}, function(err, m) {
			res.send({html: m});
		});
	}
}

exports.indexInterviews = function(req, res) {
	Knex('interviews').orderBy('created_at', 'desc')
		.then(function(blogs) {
			Knex('playlists').where('userid', req.session.userid)
			.then(function(lists) {
				Knex('genres').distinct('genre_1','genre_1_id').select()
				.then(function(genres) {
					console.log(blogs);
					if(req.session.spotifyID) {
						if(req.session.imported) {
							Knex('spotify_playlists').where('spotify_id', req.session.spotifyID)
							.then(function(spotifyLists) {
								res.render('indexInterviews', {blogs: blogs, user: req.session.user, spotify: req.session.spotifyID, lists: lists, genres: genres, spotifyLists: spotifyLists, count: 0, user_id: req.session.userid, admin: req.session.admin});
							});
						} else {
							res.render('indexInterviews', {blogs: blogs, user: req.session.user, spotify: req.session.spotifyID, lists: lists, genres: genres, spotifyLists: 1, count: 0, user_id: req.session.userid, admin: req.session.admin});
						}
					} else {
						res.render('indexInterviews', {blogs: blogs, user: req.session.user, spotify: req.session.spotifyID, lists: lists, genres: genres, spotifyLists: 0, count: 0, user_id: req.session.userid, admin: req.session.admin});
					}
				});
			});
		});
}

exports.findRelatedSongs = function(req, res) {
		console.log(req.body.artist_id);
		var sql = "select c.id, c.artist_id, c.artist, c.vid, c.name, count(*) as count from (select distinct genre from artists_genres where artist_id = "+req.body.artist_id+") a join artists_genres b  on a.genre = b.genre join songs c on b.artist_id = c.artist_id group by c.id, c.artist_id, c.artist, c.name having count(*) >= 6 order by count desc limit 50";
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

exports.thumbnails = function(req, res) {
  Knex('artists')
  .then(function(artists) {
    artists.forEach(function(artist) {
      Knex('songs').where('artist', artist.name).limit(1)
      .then(function(song) {
          if(song[0]) {song = song[0]}
          else if(song.rows) {song = song.rows}
          Knex('artists').where({id: artist.id}).update({thumbnail: song.vid})
          .then(function() {});
      });
    });
  });
  res.send(200,{});
}

exports.fbLogin = function(req, res) {
	console.log(req.body.user_id);
	var int_id = parseInt(req.body.user_id);
	Knex('users').where('fb_id', req.body.user_id)
	.then(function(model) {
		console.log(model);
		req.session.user = decodeURIComponent(model[0].username);
		req.session.userid = decodeURIComponent(model[0].id);
		req.session.admin = decodeURIComponent(model[0].admin);
		res.send(200,{});
	}).catch(function(e) {
		res.send(400,{});
	});
}

exports.fbCreateAccount = function(req, res) {
	Knex('users').where('fb_id', req.body.user_id)
	.then(function(model) {
		req.session.user = req.body.username;
		req.session.userid = decodeURIComponent(model[0].id);
		req.session.admin = decodeURIComponent(model[0].admin);
		res.send(200,{});
	}).catch(function(e) {
		Knex('users').insert({username: req.body.username, email: req.body.email, fb_id: req.body.user_id})
		.then(function() {
			Knex('users').where('fb_id', req.body.user_id)
			.then(function(m) {
				req.session.user = req.body.username;
				req.session.userid = decodeURIComponent(m[0].id);
				req.session.admin = decodeURIComponent(m[0].admin);
				res.send(200,{});
			});
		});
	});
}

exports.loginRedirect = function(req, res) {
	if(req.session.userid) {
		Knex('playlists').where('userid', req.session.userid)
		.then(function(m1) {
			Knex('genres').distinct('genre_4').orderBy('genre_4', 'asc')
			.then(function(genres) {
				Knex('followed_playlists').where({user_id: req.session.userid}).join('playlists', 'playlists.id', '=', 'followed_playlists.playlist_id').where({public: 1})
				.then(function(followed) {
					Knex('followed_artists').where({user_id: req.session.userid}).join('artists','artists.id', '=', 'followed_artists.artist_id')
					.then(function(followed_artists) {
						res.render('myLists', {session: req.session, lists: m1, genres: genres, spotify: req.session.spotifyID, followed: followed, followed_artists: followed_artists}, function(err, m) {
							res.send({html: m, ses: req.session});
						});
					});
				});
			});
		}).catch(function(e) {
			res.send(400,{});
		});
	} else {
		res.send(400,{});
	}
	
}

exports.fbOAuth = function(req, res) {
	console.log('testing-------------------');
	console.log(req);
	console.log('testing-------------------');
	res.send(200,{});
}