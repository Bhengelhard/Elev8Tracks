var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

//var redis = require('redis'); 
var session = require('express-session'); 
var RedisStore = require('connect-redis')(session);

if (process.env.REDISTOGO_URL) {
    var rtg   = require("url").parse(process.env.REDISTOGO_URL);
	var client = require("redis").createClient(rtg.port, rtg.hostname);
	client.auth(rtg.auth.split(":")[1]);
} else {
    var client = require("redis").createClient();
}

// var url = require('url');
// var redisURL = url.parse(process.env.REDISTOGO_URL); 

// var client = redis.createClient(redisURL.host, redisURL.port); 
// client.auth(redisURL.auth.split(':')[1]);

// var client = redis.createClient('127.0.0.1', '8888'); 
// client.auth('scooter2');

var client_id = 'eb30459d560a459dbd9de1b1e9788bc5'; // Your client id
var client_secret = 'bc32527d8a8f4cffba1d8d81e02998e3'; // Your client secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri

var app = express();

app.use(session({
    secret: 'sshhh',
    // create new redis store.
    store: new RedisStore({ client: client}),
    saveUninitialized: false,
    resave: false
}));

app.use(cookieParser())
//   .use(sessions(config.redis_url, config.cookie_secret));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'))

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var routes = require('./controllers/playlistC.js');
var spotify = require('./controllers/spotifyC.js');

app.get('/', routes.index);
app.get('/index2', routes.index2);
app.get('/playlists/d', routes.playlists);
app.get('/songs/d', routes.songs);
app.get('/blogs/d', routes.blogs);
app.get('/getLoginNav', routes.getLoginNav);

app.get('/songs/trending', routes.songsViewTrending);
app.get('/songs', routes.songsViewTrending);
app.get('/songs/trending/:vid', routes.songsViewTrendingPlay);

app.get('/myLists/d', routes.myLists);
app.get('/playlistmodel', routes.playlistmodel);

app.post('/showList', routes.showList);
app.post('/addToList', routes.addSong);
app.post('/storeSong', routes.storeSong);
app.post('/storeBlog', routes.storeBlog);
app.post('/removeBlock/:data', routes.removeBlock);
app.post('/videoSearch', routes.videoSearch);
app.post('/textVideoSearch', routes.textVideoSearch);
app.post('/login', routes.login);
app.get('/logout', routes.logout);
app.post('/signUp', routes.signUp);
app.post('/createList', routes.createList);
app.post('/deleteList', routes.deleteList);
app.post('/deleteSong', routes.deleteSong);
app.post('/updateListOrder', routes.updateListOrder);
app.post('/updateListName', routes.updateListName);
app.post('/likeSong', routes.likeSong);
app.post('/updateListName', routes.updateListName);
app.post('/unlikeSong', routes.unlikeSong);
app.post('/staffAdd', routes.staffAdd);
app.post('/staffRemove', routes.staffRemove);
app.get('/genreUpdate', routes.newgenreUpdate);

app.get('/blogInterviews', routes.blogInterviews);
app.get('/blogVideos', routes.blogVideos);
app.post('/refreshGenres', routes.refreshGenres);

var stateKey = 'spotify_auth_state';

var spotify = require('./controllers/spotifyC.js');

app.get('/spotifyCheck', spotify.check);
app.get('/spotifyLogin', spotify.login);
app.get('/spotifyAuthorize', spotify.authorize);
app.get('/importSpotify', spotify.importSpotify);
app.get('/callback', spotify.callback);
app.get('/refresh_token', spotify.refresh_token);

console.log('Listening on 8888');
app.listen(process.env.PORT || 8888);
