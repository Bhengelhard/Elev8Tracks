var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var client_id = 'eb30459d560a459dbd9de1b1e9788bc5'; // Your client id
var client_secret = 'bc32527d8a8f4cffba1d8d81e02998e3'; // Your client secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'))
   .use(cookieParser());
/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var routes = require('./controllers/playlistC.js');

app.get('/', routes.index);
app.get('/index2', routes.index2);
app.get('/playlists', routes.playlists);
app.get('/songs', routes.songs);
app.get('/blogs', routes.blogs);

var stateKey = 'spotify_auth_state';

var spotify = require('./controllers/spotifyC.js');

app.get('/login', spotify.login);
app.get('/callback', spotify.callback);
app.get('/refresh_token', spotify.refresh_token);

console.log('Listening on 8888');
app.listen(8888);
