var Song = require('../models/song');
var request = require("request");
var Pop = require("../models/popularity");
var Knex = require('../init/knex');

var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

// for local development
var api_key = 'AIzaSyBbIYtX2_L7X3GDe33LLxoYlWJBOcHWUwA';

exports.checkViews = function(req, res) {
  var vids = '_zR6ROjoOX0,s-BW2gKnVz8'

  Knex('songs').groupBy('vid')
    .then(function(songs) {
      var vids = '';
      var n = 0;
      songs.forEach(function(song) {
        if(song.vid != '#NAME?')
          vids += song.vid + ',';
        n++;
        if(n%20 == 0 || n == songs.length) {
          vids = vids.substring(0,vids.length - 1);
          queryViews(vids);
          vids = '';
        }
      });
      res.send(200,{});
    });
}

function getLastViewCount(m) {
  if(m.attributes.pop_6 != 0)
    return m.attributes.pop_6;
  else if(m.attributes.pop_5 != 0)
    return m.attributes.pop_5;
  else if(m.attributes.pop_4 != 0)
    return m.attributes.pop_4;
  else if(m.attributes.pop_3 != 0)
    return m.attributes.pop_3;
  else if(m.attributes.pop_2 != 0)
    return m.attributes.pop_2;
  else
    return m.attributes.pop_1;
}

function queryViews(vids) {
  request("https://www.googleapis.com/youtube/v3/videos?part=statistics&id=" + vids + "&key=" + api_key + "&alt=json", function(error, response, body) {
    var items = JSON.parse(body).items;
    var time = new Date();
    var today = time.toISOString().substr(0, 19).replace('T', ' ');
    time.setDate(time.getDate() - 1);
    items.forEach(function(item) {
      new Pop({vid: item.id}).fetch({require: true})
      .then(function(m) {
        if(new Date(m.attributes.updated_at) <= new Date(time)) {
          var week = getLastViewCount(m);
          week = item.statistics.viewCount - week;
          m.save({pop_1: item.statistics.viewCount, pop_2: m.attributes.pop_1, pop_3: m.attributes.pop_2, pop_4: m.attributes.pop_3, pop_5: m.attributes.pop_4, pop_6: m.attributes.pop_5, pop_7: m.attributes.pop_6, pop_week: week, updated_at: today});
        }
      }).catch(function(e) {
        new Pop({pop_1: item.statistics.viewCount, vid: item.id, updated_at: today}).save();
      });
    });

    console.log(JSON.parse(body).items[0].statistics.viewCount);
  });
}

