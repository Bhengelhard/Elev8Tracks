var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var favicon = require('serve-favicon');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var config = require('./init/config');
var Knex = require('./init/knex');

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

app.use(favicon(__dirname + '/public/images/favicon.ico'));

app.use(cookieParser())
//   .use(sessions(config.redis_url, config.cookie_secret));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'))

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

//Passport setup for Facebook Login

passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new FacebookStrategy({
    clientID: config.facebookAuth.clientID,
    clientSecret: config.facebookAuth.clientSecret,
    callbackURL: config.facebookAuth.callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      //Check whether the User exists or not using profile.id
      //Further DB code.
      console.log(profile);
      Knex('users').where('fb_id', profile.id)
      .then(function(model) {
        console.log(model.length);
        if(model.length != 0)
          return done(null, model);
        else {
          Knex('users').insert({username: profile.displayName, fb_id: profile.id})
          .then(function() {
            Knex('users').where('fb_id', profile.id)
            .then(function(m) {
              // req.session.user = profile.first_name;
              // req.session.userid = decodeURIComponent(m[0].id);
              // req.session.admin = decodeURIComponent(m[0].admin);
              return done(null, m);
            });
          });
        }
      }).catch(function(e) {
        console.log('catch');
        Knex('users').insert({username: profile.displayName, fb_id: profile.id})
        .then(function() {
          Knex('users').where('fb_id', profile.id)
          .then(function(m) {
            // req.session.user = profile.first_name;
            // req.session.userid = decodeURIComponent(m[0].id);
            // req.session.admin = decodeURIComponent(m[0].admin);
            return done(null, m);
          });
        });
      });
    });
  }
));

app.use(passport.initialize());
app.use(passport.session());

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
var mobile = require('./controllers/mobileC.js');

app.get('/blog', checkForMobile, routes.index);
app.get('/', checkForMobile, routes.index);
app.get('/mobile', mobile.mobile);
app.get('/index2', routes.index2);
app.get('/playlists/d', routes.playlists);
app.get('/songs/d', routes.songs);
app.get('/blogs/d', routes.blogs);
app.get('/getLoginNav', routes.getLoginNav);

app.get('/songs/trending', checkForMobile, routes.songsViewTrending);
app.get('/songs', checkForMobile, routes.songsViewTrending);
app.get('/songs/trending/:vid', checkForMobile, routes.songsViewTrendingPlay);
app.get('/blog/:vid', checkForMobile, routes.blogPlay);

app.get('/interviews', routes.indexInterviews);

app.get('/myLists/d', routes.myLists);
app.get('/myLists', routes.myLists);
app.get('/playlistmodel', routes.playlistmodel);
app.get('/thumbnails', routes.thumbnails);

app.post('/showList', routes.showList);
app.post('/addToList', routes.addSong);
app.post('/storeSong', routes.storeSong);
app.post('/storeBlog', routes.storeBlog);
app.post('/removeBlock', routes.removeBlock);
app.post('/videoSearch', routes.videoSearch);
app.post('/textVideoSearch', routes.textVideoSearch);
app.post('/login', routes.login);
app.get('/loginRedirect', routes.loginRedirect);
app.get('/logout', routes.logout);
app.post('/signUp', routes.signUp);
app.post('/createList', routes.createList);
app.post('/deleteList', routes.deleteList);
app.post('/updateListOrder', routes.updateListOrder);
app.post('/updateListName', routes.updateListName);
// app.post('/likeSong', routes.likeSong);
app.post('/updateListName', routes.updateListName);
app.post('/updateBlogText', routes.updateBlogText);
app.post('/updateInterviewText', routes.updateInterviewText);
// app.post('/unlikeSong', routes.unlikeSong);
app.post('/staffAdd', routes.staffAdd);
app.post('/staffRemove', routes.staffRemove);
app.post('/artistSearch', routes.artistSearch);
app.post('/playlistSongDelete', routes.playlistSongDelete);
app.get('/genreUpdate', routes.newgenreUpdate);

app.get('/blogInterviews', routes.blogInterviews);
app.get('/blogVideos', routes.blogVideos);
app.post('/refreshGenres', routes.refreshGenres);
app.post('/playlistsSearch', routes.playlistsSearch);
app.post('/makePublic', routes.makePublic);
app.post('/followList', routes.followList);
app.post('/unfollowList', routes.unfollowList);
app.post('/followArtist', routes.followArtist);
app.post('/unfollowArtist', routes.unfollowArtist);
app.post('/findRelatedSongs', routes.findRelatedSongs);

var stateKey = 'spotify_auth_state';

var spotify = require('./controllers/spotifyC.js');

app.get('/spotifyCheck', spotify.check);
app.get('/spotifyLogin', spotify.login);
app.get('/spotifyAuthorize', spotify.authorize);
app.get('/importSpotify', spotify.importSpotify);
app.get('/callback', spotify.callback);
app.get('/refresh_token', spotify.refresh_token);
app.get('/spotifyIDUpdate', spotify.idUpdate);
app.get('/checkImport', spotify.checkImport);
app.get('/spotifyDataUpdate', spotify.dataUpdate);
app.post('/showSpotifyList', spotify.showList);
app.post('/spotifyMatchSearch', spotify.matchSearch);
app.get('/spotifyArtistMatch', spotify.artistMatch);
app.get('/spotifyRelatedArtists', spotify.relatedArtists);

app.post('/fbLogin', routes.fbLogin); 
app.post('/fbCreateAccount', routes.fbCreateAccount);
app.get('/fbOAuth', routes.fbOAuth);

app.get('/auth/facebook', passport.authenticate('facebook', {scope: 'public_profile,email'}));
app.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect : '/sessionStore', 
    failureRedirect : '/' 
  }));

app.get('/sessionStore', function(req, res) {
  req.session.user = req.user[0].username;
  req.session.userid = req.user[0].id;
  req.session.admin = req.user[0].admin;
  res.redirect('/');
})

console.log('Listening on 8888');
app.listen(process.env.PORT || 8888);


// regex to detect if user is mobile
function isCallerMobile(req) {
  var ua = req.headers['user-agent'].toLowerCase(),
    isMobile = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(ua) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(ua.substr(0, 4));

  return !!isMobile;
}

// note: the next method param is passed as well
function checkForMobile(req, res, next) {
  // check to see if the caller is a mobile device
  var isMobile = isCallerMobile(req);

  if (isMobile) {
    console.log("Going mobile");
    res.redirect('/mobile');
  } else {
      if(req.isAuthenticated()) {
        req.session.user = req.user[0].username;
        req.session.userid = req.user[0].id;
        req.session.admin = req.user[0].admin;
      } 
      // if we didn't detect mobile, call the next method, which will eventually call the desktop route
      return next();
  }
}