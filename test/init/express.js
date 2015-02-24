var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');

var app = express();

// settings
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use(app.router);
app.use(cookieParser());

// default listen on 3000
app.set('port', process.env.PORT || 3000);

// export the app.
module.exports = app;