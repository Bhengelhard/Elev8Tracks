var Playlist = require('../models/playlist');
var Artist = require('../models/spotify_artist');

var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var client_id = 'eb30459d560a459dbd9de1b1e9788bc5'; // Your client id
var client_secret = 'bc32527d8a8f4cffba1d8d81e02998e3'; // Your client secret
var redirect_uri = 'http://localhost:8888/callback';

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
  console.log(state);
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
  console.log(state);

  if (state === null || state !== storedState) {
    console.log('error');
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    console.log('auth');
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
          var spotifySongs = [];
          var spotifyTable = [];
          var n = 0;
          request.get(playlists, function(error, data, body) {
            for(var i = 0; i < data.body.items.length; i++) {
              console.log(data.body.items[i].tracks.href);
              console.log(data.body.items[i].name);
              console.log('---' + req.session.spotifyID);
              var spotifyPlaylist = {
                url: data.body.items[i].tracks.href,
                headers: { 'Authorization': 'Bearer ' + access_token },
                json: true
              };
              request.get(spotifyPlaylist, function(error, tracks, body) {
                for(var j = 0; j < tracks.body.items.length; j++) {
                  spotifySongs.push(tracks.body.items[j].track.name);
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
                        new Artist({artist: spotifyArtists[k], spotify_id: req.session.spotifyID}).save();
                      }
                  });
                }
              });
            }
          });
          res.redirect('/');
        });
        // we can also pass the token to the browser to make requests from there
      //   res.redirect('/#' +
      //     querystring.stringify({
      //       access_token: access_token,
      //       refresh_token: refresh_token
      //     }));
      // } else {
      //   res.redirect('/#' +
      //     querystring.stringify({
      //       error: 'invalid_token'
      //     }));
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