var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

//for local development
// var client_id = 'eb30459d560a459dbd9de1b1e9788bc5'; // Your client id
// var client_secret = 'bc32527d8a8f4cffba1d8d81e02998e3'; // Your client secret
// var redirect_uri = 'http://localhost:8888/callback';

var client_id = '5950480cce6844a6bb8c6bb7a12127f9';
var client_secret = '07dfa62b2b66491aa4bf452bc1fef529';
var redirect_uri = 'http://elevatemore.com/callback';

var Knex = require('../init/knex');
var imported = 0;

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
                  if(tracks.body.items[j].track.name == 'All Gold Everything') {
                    console.log(tracks.body.items[j].track.id);
                    console.log(tracks.body.href.split('playlists/')[1].split('/tracks')[0]);
                  }
                  listTracks.push({insert: {spotify_user_id: req.session.spotifyID, spotify_id: tracks.body.items[j].track.id, playlist_id: tracks.body.href.split('playlists/')[1].split('/tracks')[0], song_id: 0}, name: tracks.body.items[j].track.name, artist: tracks.body.items[j].track.artists[0].name});
                }
                n++;
                if(n == data.body.items.length) {
                        console.log(m);
                        console.log(n);
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
                                    var sql = 'SELECT * FROM songs WHERE lower(name) = lower("' + track.name.split(" (")[0].split(' feat.')[0] + '") AND lower(artist) = lower("' + track.artist + '")';
                                    console.log(sql);
                                    if(track.name.split(" (")[0].split(' feat.')[0].indexOf('"') > 0 || track.artist.indexOf('"') > 0) {
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
                                      });
                                    }
                                  }
                                }).catch(function() {
                                  var sql = 'SELECT * FROM songs WHERE lower(name) = lower("' + track.name.split(" (")[0].split(' feat.')[0] + '") AND lower(artist) = lower("' + track.artist + '")';
                                  if(track.name.split(" (")[0].split(' feat.')[0].indexOf('"') > 0 || track.artist.indexOf('"') > 0) {
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
                                          if(track.artist == 'Trinidad James') {
                                            console.log(textMatch);
                                            console.log(textMatch.id);
                                          }
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
    Knex('songs').then(function(m) {
      idUpdater(0, m);
    });
  });
  res.send(200, {});
}

function idUpdater(n, songs) {
    if(n < songs.length) {
      var name = songs[n].name;
      if(songs[n].artist != null)
        var artist = songs[n].artist.toLowerCase().split(' feat.')[0].split(' ft.')[0];
      else
        var artist = '';
      var search = name + ' ' + artist;
      var url = 'https://api.spotify.com/v1/search?q=' + encodeURIComponent(search) + '&type=track';
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
        console.log(response.tracks.items[0].artists[0].name);
        res.render('spotifyMatches', {songs: response.tracks.items}, function(err, model) {
          res.send(200,{html: model});
        });
      });
}

exports.checkImport = function(req, res) {
  console.log(imported);
  if(imported == 1) {
    Knex('spotify_playlists').where('spotify_id', req.session.spotifyID)
    .then(function(lists) {
      res.render('spotifyLists', {spotifyLists: lists}, function(err, html) {
        console.log('success!!');
        res.send(200,{html: html});
      })
    });
  } else {
    res.send(200,{html: 0});
  }
}

