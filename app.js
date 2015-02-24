var http = require("http");
var express = require('express');
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var client_id = 'eb30459d560a459dbd9de1b1e9788bc5'; // Your client id
var client_secret = 'bc32527d8a8f4cffba1d8d81e02998e3'; // Your client secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

var routes = require('./controllers/home');

app.get('/', routes.index);
app.get('/login', routes.login);
app.get('/callback', routes.callback);
app.get('/refresh_token', routes.refresh_token);

var server = app.listen(8888, function() {
    console.log('Listening on port %d', server.address().port);
});