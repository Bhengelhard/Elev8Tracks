var access_token;
var userid;
var spotifyUser = [];
var spotifySongs = [];
var spotifyArtists = [];

function spotify() {


        /**
         * Obtains parameters from the hash of the URL
         * @return Object
         */

        // var userProfileSource = document.getElementById('user-profile-template').innerHTML,
        //     userProfileTemplate = Handlebars.compile(userProfileSource),
        //     userProfilePlaceholder = document.getElementById('user-profile');

        // var oauthSource = document.getElementById('oauth-template').innerHTML,
        //     oauthTemplate = Handlebars.compile(oauthSource),
        //     oauthPlaceholder = document.getElementById('oauth');

        var params = getHashParams();

        access_token = params.access_token;
        var refresh_token = params.refresh_token,
            error = params.error;

        if (error) {
          alert('There was an error during the authentication');
        } else {
          if (access_token) {
            $.ajax({
                url: 'https://api.spotify.com/v1/me',
                headers: {
                  'Authorization': 'Bearer ' + access_token
                },
                success: function(response) {
                  console.log(response);
                  userid = response.id;
                  getPlaylists();
                }
            });
          } else {
              // // render initial screen
              // $('#login').show();
              // $('#loggedin').hide();
              // $('#loggedin .name').html('');
          }

        }

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