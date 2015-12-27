var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

// for local development
// var client_id = 'eb30459d560a459dbd9de1b1e9788bc5'; // Your client id
// var client_secret = 'bc32527d8a8f4cffba1d8d81e02998e3'; // Your client secret
// var redirect_uri = 'http://localhost:8888/callback';

var client_id = '5950480cce6844a6bb8c6bb7a12127f9';
var client_secret = '07dfa62b2b66491aa4bf452bc1fef529';
var redirect_uri = 'http://www.elev8tracks.com/callback';

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
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state,
      show_dialog: true
    }));
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
          request.get(playlists, function(error, data, body) {
            for(var i = 0; i < data.body.items.length; i++) {
              var spotifyPlaylist = {
                url: data.body.items[i].tracks.href,
                headers: { 'Authorization': 'Bearer ' + access_token },
                json: true
              };
              request.get(spotifyPlaylist, function(error, tracks, body) {
                var listTracks = [];
                for(var j = 0; j < tracks.body.items.length; j++) {
                  for(var k = 0; k < tracks.body.items[j].track.artists.length; k++) {
                    var artist = tracks.body.items[j].track.artists[k].name.replace(new RegExp('"', 'g'), "'");
                    if(spotifyArtists.indexOf(artist) < 0) {
                      var tableInsert = {name: artist, spotify_id: req.session.spotifyID};
                      spotifyArtists.push(artist);
                      spotifyTable.push(tableInsert);
                    }
                  }
                }
                n++;
                if(n == data.body.items.length) {
                  Knex('spotify_artists').where({spotify_id: req.session.spotifyID}).del()
                  .then(function(model) {
                      for(var k = 0; k < spotifyArtists.length; k++) {
                        Knex('spotify_artists').insert({artist: spotifyArtists[k], spotify_id: req.session.spotifyID, user_id: req.session.userid});
                      }
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