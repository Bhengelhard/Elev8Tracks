var access_token;
var userid;
var spotifyUser = [];
var spotifySongs = [];
var spotifyArtists = [];

function spotify() {

        $.get('/spotifyCheck', function(res) {
          if(res.check == 'Y') {
            console.log('logged in');
          } else {
            console.log('logged out');
          }
        });
}

function getHashParams() {
          var hashParams = {};
          var e, r = /([^&;=]+)=?([^&;]*)/g,
              q = window.location.hash.substring(1);
          while ( e = r.exec(q)) {
             hashParams[e[1]] = decodeURIComponent(e[2]);
          }
          return hashParams;
        }

function getPlaylists() {
  $.ajax({
    url: 'https://api.spotify.com/v1/users/' + userid + '/playlists',
    headers: {
      'Authorization': 'Bearer ' + access_token
    },
    success: function (res) {
      for(var i = 0; i < res['items'].length; i++) {
        var listID = res['items'][i].id;
        $.ajax({
          url: 'https://api.spotify.com/v1/users/' + userid + '/playlists/' + res['items'][i].id + '/tracks',
          headers: {
            'Authorization': 'Bearer ' + access_token
          },
          success: function(tracks) {
            for(var j = 0; j < tracks.items.length; j++) {
              spotifySongs.push(tracks.items[j].track.name);
              for(var k = 0; k < tracks.items[j].track.artists.length; k++) {
                spotifyArtists.push(tracks.items[j].track.artists[k].name);
              }
            }
          }
        });
      }
    }
  });
}

function spotifyHTML() {
  $html = $('#vitemStaff.vItem').clone().attr('id', 'vitemArtists').addClass('spotify');
  $html.find('.itemName').html('Spotify Artists');
  $('#filterDrop').append($html);
  $('#finder').append($('<div id="spotifyLogin">Change Spotify</div>'));
}

function removeSpotify() {
  $('#ditemSpotifyArtists').remove();
}