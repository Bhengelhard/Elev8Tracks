var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

//for local development
var client_id = 'eb30459d560a459dbd9de1b1e9788bc5'; // Your client id
var client_secret = 'bc32527d8a8f4cffba1d8d81e02998e3'; // Your client secret
var redirect_uri = 'http://localhost:8888/callback';

// var client_id = '5950480cce6844a6bb8c6bb7a12127f9';
// var client_secret = '07dfa62b2b66491aa4bf452bc1fef529';
// var redirect_uri = 'http://elevatemore.com/callback';

var Knex = require('../init/knex');
var imported = 1;

var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

exports.login = function(req, res) {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);
  // your application requests authorization
  var scope = 'user-read-private user-read-email playlist-read-private';
  var url = 'https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state,
      show_dialog: true
    });
  res.send("<script> top.location.href='"+ url + "'</script>");
  // res.redirect('https://accounts.spotify.com/authorize?' +
  //   querystring.stringify({
  //     response_type: 'code',
  //     client_id: client_id,
  //     scope: scope,
  //     redirect_uri: redirect_uri,
  //     state: state,
  //     show_dialog: true
  //   }));
};

exports.callback = function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    console.log('error');
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          req.session.spotifyID = response.body.id;
          req.session.access_token = access_token;
          req.session.refresh_token = refresh_token;
          req.session.imported = 0;
          imported = 0;

          var playlists = {
            url: 'https://api.spotify.com/v1/users/' + req.session.spotifyID + '/playlists',
            headers: { 'Authorization': 'Bearer ' + access_token },
            json: true
          };
          var n = 0,
              m = 0;
          var spotifyLists = [];
          var listTracks = [];
          request.get(playlists, function(error, data, body) {
            for(var i = 0; i < data.body.items.length; i++) {
              spotifyLists.push({name: data.body.items[i].name, spotify_id: req.session.spotifyID, playlist_id: data.body.items[i].id, track_ids: ''});
              var spotifyPlaylist = {
                url: data.body.items[i].tracks.href,
                headers: { 'Authorization': 'Bearer ' + access_token },
                json: true
              };
              request.get(spotifyPlaylist, function(error, tracks, body) {
                for(var j = 0; j < tracks.body.items.length; j++) {
                  m++;
                  listTracks.push({insert: {spotify_user_id: req.session.spotifyID, spotify_id: tracks.body.items[j].track.id, playlist_id: tracks.body.href.split('playlists/')[1].split('/tracks')[0], song_id: 0}, name: tracks.body.items[j].track.name, artist: tracks.body.items[j].track.artists[0].name});
                }
                n++;
                if(n == data.body.items.length) {
                        if(!req.session.userid)
                          var userid = 0;
                        else 
                          var userid = req.session.userid;
                        Knex('spotify_playlists').where({spotify_id: req.session.spotifyID}).del()
                        .then(function() {
                          Knex('spotify_playlists').insert(spotifyLists)
                          .then(function() {
                            Knex('spotify_songs_playlists').where({spotify_user_id: req.session.spotifyID}).del()
                            .then(function() {
                              listTracks.forEach(function(track) {
                                Knex('spotify_match').where('spotify_id',track.insert.spotify_id)
                                .then(function(match) {
                                  if(match[0]) {
                                    match = match[0];
                                  } else {
                                    match = match.rows;
                                  }
                                  if(typeof match != 'undefined') {
                                    track.insert.song_id = match.song_id;
                                    Knex('spotify_songs_playlists').insert(track.insert)
                                    .then(function() {
                                      req.session.imported = 1;
                                      imported = 1;
                                    });
                                  } else {
                                    var sql = "SELECT * FROM songs WHERE lower(name) = lower('" + track.name.split(" (")[0].split(' feat.')[0] + "') AND lower(artist) = lower('" + track.artist + "')";
                                    if(track.name.split(" (")[0].split(' feat.')[0].indexOf('"') < 0 || track.artist.indexOf('"') < 0) {
                                      Knex.raw(sql).then(function(textMatch) {
                                        if(textMatch[0]) {
                                          textMatch = textMatch[0];
                                          if(textMatch[0]) {
                                            textMatch = textMatch[0];
                                          }
                                        } else {
                                          textMatch = textMatch.rows[0];
                                        }
                                        if(typeof textMatch != 'undefined') {
                                          track.insert.song_id = textMatch.id;
                                        } else {
                                          track.insert.song_id = 0;
                                        }
                                        Knex('spotify_songs_playlists').insert(track.insert)
                                        .then(function() {
                                          if(track.insert.song_id != 0) {
                                            var matchInsert = {song_id: track.insert.song_id, spotify_id: track.insert.spotify_id};
                                            Knex('spotify_match').insert(matchInsert)
                                            .then(function() {
                                              req.session.imported = 1;
                                              imported = 1;
                                            });
                                          } else {
                                            req.session.imported = 1;
                                            imported = 1;
                                          }
                                        });
                                      }).catch(function() {
                                        track.insert.song_id = 0;
                                        Knex('spotify_songs_playlists').insert(track.insert)
                                        .then(function() {
                                          req.session.imported = 1;
                                          imported = 1;
                                        });
                                      })
                                    }
                                  }
                                }).catch(function() {
                                  console.log('__****');
                                  listTracks.forEach(function(track) {
                                    var sql = 'SELECT * FROM songs WHERE lower(name) = lower("' + track.name.split(" (")[0].split(' feat.')[0] + '") AND lower(artist) = lower("' + track.artist + '")';
                                    if(track.name.split(" (")[0].split(' feat.')[0].indexOf('"') < 0 && track.artist.indexOf('"') < 0) {
                                      Knex.raw(sql).then(function(textMatch) {
                                          if(textMatch[0]) {
                                            textMatch = textMatch[0];
                                            if(textMatch[0]) {
                                              textMatch = textMatch[0];
                                            }
                                          } else {
                                            textMatch = textMatch.rows;
                                          }
                                          if(typeof textMatch != 'undefined') {
                                            track.insert.song_id = textMatch.id;
                                          }
                                          Knex('spotify_songs_playlists').insert(track.insert)
                                          .then(function() {
                                            req.session.imported = 1;
                                            imported = 1;
                                          });
                                      }).catch(function() {
                                          Knex('spotify_songs_playlists').insert(track.insert)
                                          .then(function() {
                                            req.session.imported = 1;
                                            imported = 1;
                                          });
                                      });
                                    }
                                  });
                                });
                              });
                            });
                          });
                        });
                }
              });
            }
          });
          res.redirect('/');
        });
      }
    });
  }
}; 

exports.refresh_token = function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
};

exports.authorize = function(req, res) {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email playlist-read-private';

  $.get("https://accounts.spotify.com/authorize", {
    client_id: client_id, 
    response_type: 'code',
    redirect_uri: 'http://localhost:8888/callback',
    scope: sope
  }).done(function(res) {
      console.log('scopes');
      $.post("https://accounts.spotify.com/api/token", {
        grant_type: 'authorization_code',
        code: res.code,
        redirect_uri: 'http://localhost:8888/callback',
        client_id: 'eb30459d560a459dbd9de1b1e9788bc5',
        client_secret: 'bc32527d8a8f4cffba1d8d81e02998e3'
      }).done(function(token) {
        res.send(200, {token: token});
      });
  });
}

exports.check = function(req, res) {
  if(req.session.spotifyID) {
    res.send(200,{check: 'Y'});
  } else {
    res.send(200,{check: 'N'});
  }
}

exports.importSpotify = function(req, res) {
  if(req.session.spotifyID) {
    var playlists = {
      url: 'https://api.spotify.com/v1/users/' + req.session.spotifyID + '/playlists',
      headers: { 'Authorization': 'Bearer ' + req.session.access_token },
      json: true
    };
    var listObj = {};
    var n = 0;
    request.get(playlists, function(error, data, body) {
      if (!error && data.statusCode === 200) {
        Knex('spotify_songs').where({user_id: req.session.userID}).del()
        .then(function(model) {
          for(var i = 0; i < data.body.items.length; i++) {
            var spotifyPlaylist = {
              url: data.body.items[i].tracks.href,
              headers: { 'Authorization': 'Bearer ' + req.session.access_token },
              json: true
            };
            listObj[String(data.body.items[i].tracks.href).split('playlists/')[1].replace('/tracks','')] = data.body.items[i].name;
            Knex('playlists').insert({name: data.body.items[i].name, spotify_id: req.session.spotifyID, spotify_songid: tracks.body.items[j].track.id});
            request.get(spotifyPlaylist, function(error, tracks, body) {
              if(n == 0) {
                Knex('spotify_songs').where({spotify_id: req.session.spotifyID}).del();
                n++;
              }
              for(var j = 0; j < tracks.body.items.length; j++) {
                var listName = listObj[String(tracks.body.href).split('playlists/')[1].split('/tracks')[0]];
                Knex('spotify_songs').insert({name: tracks.body.items[j].track.name, spotify_id: req.session.spotifyID, spotify_songid: tracks.body.items[j].track.id});
              }
            });
          } 
        });
      } else {
        res.send(200,{error: 'login'});
      }
    });
  } else {
    res.send(200,{error: 'login'});
  }
}

exports.idUpdate = function(req, res) {
  Knex('spotify_match').del()
  .then(function() {
    Knex('songs').orderBy('id','asc').then(function(m) {
      idUpdater(0, m);
    });
  });
  res.send(200, {});
}

function idUpdater(n, songs) {
    if(n < songs.length) {
      var name = songs[n].name;
      console.log(name);
      if(songs[n].artist != null)
        var artist = songs[n].artist.toLowerCase().split(' feat.')[0].split(' ft.')[0];
      else
        var artist = '';
      var search = name + ' ' + artist;
      var url = 'https://api.spotify.com/v1/search?q=' + encodeURIComponent(search) + '&limit=40&type=track';
      request.get(url, function(error, data, body) {
        var response = JSON.parse(body);
        var spotify_match = [];
        if(response.tracks) {
          response.tracks.items.forEach(function(item) {
            for(var i = 0; i < item.artists.length; i++) {
              if(item.artists[i].name.toLowerCase() == artist) {
                spotify_match.push({song_id: songs[n].id, spotify_id: item.id});
              }
            }
          }); 
        }
        console.log(spotify_match);
        if(spotify_match.length > 0) {
          Knex('spotify_match').insert(spotify_match)
          .then(function() {
            console.log('updated');
          });
        } 
        console.log(n);
        n = n+1;
        idUpdater(n, songs);
      });
    }
}

exports.showList = function(req, res) {
  console.log(req.body.playlist_id);
  Knex('spotify_playlists').where('playlist_id',req.body.playlist_id)
  .then(function(list) {
    console.log(list[0].playlist_id);
    Knex('songs').join('spotify_songs_playlists', 'songs.id', '=', 'spotify_songs_playlists.song_id').where('spotify_songs_playlists.spotify_user_id','=',req.session.spotifyID).andWhere('spotify_songs_playlists.playlist_id','=',list[0].playlist_id)
    .then(function(m) {
      res.render('songs', {songs: m, session: req.session}, function(err, model) {
        res.send({html: model, m: m});
      });
    });
  });
}

exports.matchSearch = function(req, res) {
  var search = req.body.name + ' ' + req.body.artist;
  var url = 'https://api.spotify.com/v1/search?q=' + encodeURIComponent(search) + '&type=track&limit=40';
      request.get(url, function(error, data, body) {
        var response = JSON.parse(body);
        var query = '';
        // res.render('spotifyMatches', {songs: response.tracks.items}, function(err, model) {
        //     res.send(200,{html: model});
        //   });
        var searchResults = [];
        response.tracks.items.forEach(function(track) {
          query += track.id + ',';
          searchResults.push({id: track.id, name: track.name, artist: track.artists[0].name, artist_id: track.artists[0].id, album: track.album.name, album_id: track.album.id, pop: track.popularity})
        });
        query = query.slice(0, -1);
        var audio_url = {
          url: 'https://api.spotify.com/v1/audio-features/?ids=' + query,
          headers: { 'Authorization': 'Bearer ' + req.session.access_token },
          json: true
        };
        var n = 0;
        request.get(audio_url, function(error, data, body) {
          console.log('Error: ' + error);
          console.log('Data: ' + data.body.audio_features);
          if(searchResults.length > 0 && data.body.audio_features) {
            data.body.audio_features.forEach(function(audio) {
                console.log(audio);
                searchResults[n].energy = audio.energy;
                searchResults[n].danceability = audio.danceability;
                searchResults[n].key = audio.key;
                searchResults[n].loudness = audio.loudness;
                searchResults[n].mode = audio.mode;
                searchResults[n].speechiness = audio.speechiness;
                searchResults[n].acousticness = audio.acousticness;
                searchResults[n].instrumentalness = audio.instrumentalness;
                searchResults[n].liveness = audio.liveness;
                searchResults[n].valence = audio.valence;
                searchResults[n].tempo = audio.tempo;
              n++;
            });
          }
          res.render('spotifyMatches', {songs: searchResults}, function(err, model) {
            res.send(200,{html: model});
          });
        });
      });
}

exports.checkImport = function(req, res) {
  if(imported == 1) {
    Knex('spotify_playlists').where('spotify_id', req.session.spotifyID)
    .then(function(lists) {
      res.render('spotifyLists', {spotifyLists: lists}, function(err, html) {
        res.send(200,{html: html});
      })
    });
  } else {
    res.send(200,{html: 0});
  }
}

exports.dataUpdate = function(req, res) {
  var queries = [];
  var ids = [];
  var n = 0;
  Knex('spotify_match').groupBy('song_id','spotify_id')
  .then(function(matches) {
    if(matches.rows) {
      matches = matches.rows;
    }
    var querystring = '';
    var idstring = [];
    matches.forEach(function(match) {
      if(n < 50) {
        querystring += match.spotify_id + ',';
        idstring.push(match.song_id);
        n += 1;
      } else {
        queries.push(querystring.slice(0, -1));
        ids.push(idstring.slice(0, -1));
        querystring = '';
        idstring = [];
        n = 0;
      }
    });
    for(var i = 0; i < queries.length; i++) {
      n = 0;
      var trackData = {
        url: 'https://api.spotify.com/v1/audio-features/?ids=' + queries[i],
        headers: { 'Authorization': 'Bearer ' + req.session.access_token },
        json: true
      };
      request.get(trackData, function(error, data, body) {
        data.body.audio_features.forEach(function(track) {
          if(track != null) {
            Knex('spotify_match').where('spotify_id', track.id)
            .then(function(m) {
              if(m[0]) {
                m = m[0];
              } else {
                m = m.rows;
              }
              console.log(m);
              Knex('songs').where('id', m.song_id).update({energy: track.energy, danceability: track.danceability, key: track.key, loudness: track.loudness, mode: track.mode, speechiness: track.speechiness, acousticness: track.acousticness, instrumentalness: track.instrumentalness, liveness: track.liveness, valence: track.valence, tempo: track.tempo})
              .then(function() {
                console.log('done');
              });
            }).catch(function(e) {
              console.log(e);
            });
            n++;
          }
        });
      });
    }
    res.send(200);
  });
}

exports.artistMatch = function() {
  Knex('artists')
  .then(function(m) {
    if(m.rows) {
      m = m.rows;
    } 
    var n = 0;
    m.forEach(function(artist) {
      setTimeout(function() {
        var url = 'https://api.spotify.com/v1/search?q=' + encodeURIComponent(artist.name) + '&limit=10&type=artist';
        Knex('songs').where('artist_id', artist.id).limit(1)
          .then(function(song) {
            if(song[0] && song[0].vid) {
              Knex('artists').where('id', artist.id).update({thumbnail: song[0].vid})
              .then(function() {
              });
            }
          });
        request.get(url, function(error, data, body) {
          var response = JSON.parse(body);
          if(response.artists && response.artists.items && response.artists.items[0]) {
                Knex('artists').where('id',artist.id).update({spotify_id: response.artists.items[0].id})
                .then(function() {

                });
                console.log(response.artists.items[0].id);
                var artistUrl = 'https://api.spotify.com/v1/artists/'+ response.artists.items[0].id +'/related-artists';
                request.get(url, function(error, data, b) {
                  var res = JSON.parse(b);
                  if(res.artists && res.artists.items) {
                    res.artists.items.forEach(function(artist) {
                      Knex('related_artists').insert({artist_id1: response.artists.items[0].id, artist_id2: artist.id})
                      .then(function(){

                      });
                    });
                  }
                });
          }
        });
      }, n);
      n += 1000;
    });
  });
}

exports.relatedArtists = function() {
  // Knex('artists')
  // .then(function(m) {
  //   if(m.rows) {
  //     m = m.rows;
  //   } 
  //   m.forEach(function(artist) {
  //     var artistUrl = 'https://api.spotify.com/v1/artists/'+ response.artists.items[0].id +'/related-artists';
  //     request.get(url, function(error, data, body) {
  //       var response = JSON.parse(body);

  //     });
  //   });
}
