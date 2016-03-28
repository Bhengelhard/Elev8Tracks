var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

// for local development
// var client_id = 'eb30459d560a459dbd9de1b1e9788bc5'; // Your client id
// var client_secret = 'bc32527d8a8f4cffba1d8d81e02998e3'; // Your client secret
// var redirect_uri = 'http://localhost:8888/callback';

var client_id = '5950480cce6844a6bb8c6bb7a12127f9';
var client_secret = '07dfa62b2b66491aa4bf452bc1fef529';
var redirect_uri = 'http://www.elevatemore.com/callback';

var Knex = require('../init/knex');

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

          var playlists = {
            url: 'https://api.spotify.com/v1/users/' + req.session.spotifyID + '/playlists',
            headers: { 'Authorization': 'Bearer ' + access_token },
            json: true
          };
          var spotifyArtists = [];
          var spotifyTable = [];
          var n = 0;
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
                  console.log(tracks.body.href.split('playlists/')[1].split('/tracks')[0]);
                  if(tracks.body.items[j].track.id != null)
                    listTracks.push({spotify_id: req.session.spotifyID, song_id: tracks.body.items[j].track.id, playlist_id: tracks.body.href.split('playlists/')[1].split('/tracks')[0]});
                  for(var k = 0; k < tracks.body.items[j].track.artists.length; k++) {
                    var artist = tracks.body.items[j].track.artists[k].name.replace(new RegExp('"', 'g'), "'");
                    if(spotifyArtists.indexOf(artist) < 0) {
                      var tableInsert = {artist: artist, spotify_id: req.session.spotifyID};
                      spotifyArtists.push(artist);
                      spotifyTable.push(tableInsert);
                    }
                  }
                }
                // listTracks = listTracks.replace(/null,/g, "").substring(0,listTracks.length-1);
                // spotifyLists[n].track_ids = listTracks;
                n++;
                if(n == data.body.items.length) {
                    Knex('spotify_artists').where({spotify_id: req.session.spotifyID}).del()
                    .then(function(model) {
                        if(!req.session.userid)
                          var userid = 0;
                        else 
                          var userid = req.session.userid;
                        Knex('spotify_playlists').where({spotify_id: req.session.spotifyID}).del()
                        .then(function() {
                          Knex('spotify_playlists').insert(spotifyLists)
                          .then(function() {
                            Knex('spotify_songs_playlists').where({spotify_id: req.session.spotifyID}).del()
                            .then(function() {
                              Knex('spotify_songs_playlists').insert(listTracks)
                              .then(function() {
                                Knex('spotify_artists').insert(spotifyTable)
                                .then(function() {
                                  console.log('artists inserted');
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
  Knex('songs').then(function(m) {
    // m.forEach(function(song) {
    //   idUpdater(song);
    // });
    // console.log(m[0]);
    console.log(m);
    idUpdater(0, m);
  });
  res.send(200, {});
}

function idUpdater(n, songs) {
    if(n < 5) {
      // var name = 'I Follow You';
      // var artist = "melody's echo chamber";
      var match = 0;
      var name = songs[n].name;
      var artist = songs[n].artist.toLowerCase().split(' feat.')[0].split(' ft.')[0];
      var url = 'https://api.spotify.com/v1/search?q=' + encodeURIComponent(name) + '&type=track';
      request.get(url, function(error, data, body) {
        var response = JSON.parse(body);
        if(response.tracks) {
          response.tracks.items.forEach(function(item) {
            for(var i = 0; i < item.artists.length; i++) {
              if(item.artists[i].name.toLowerCase() == artist && match == 0) {
                match = item.id;
                break;
              }
            }
          }); 
        }
        Knex('songs').where('id',songs[n].id).update({spotify_id: match})
        .then(function() {
          console.log(n);
          n = n+1;
          idUpdater(n, songs);
        });
      });
    }
}

exports.showList = function(req, res) {
  console.log(req.body.list_id);
  Knex('spotify_playlists').where('id',req.body.list_id)
  .then(function(list) {
    console.log(list[0].playlist_id);
    Knex('songs').join('spotify_songs_playlists', 'songs.spotify_id', '=', 'spotify_songs_playlists.song_id').where('spotify_songs_playlists.spotify_id','=',req.session.spotifyID).andWhere('spotify_songs_playlists.playlist_id','=',list[0].playlist_id)
    .then(function(m) {
      res.render('songs', {songs: m, session: req.session}, function(err, model) {
        res.send({html: model, m: m});
      });
    })
  })
}