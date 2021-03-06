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

        var access_token = params.access_token,
            refresh_token = params.refresh_token,
            error = params.error;

        if (error) {
          alert('There was an error during the authentication');
        } else {
          console.log('test1');
          if (access_token) {
            // render oauth info
            // oauthPlaceholder.innerHTML = oauthTemplate({
            //   access_token: access_token,
            //   refresh_token: refresh_token
            // });
            console.log('test3');
            $.ajax({
                url: 'https://api.spotify.com/v1/me',
                headers: {
                  'Authorization': 'Bearer ' + access_token
                },
                success: function(response) {
                  //userProfilePlaceholder.innerHTML = userProfileTemplate(response);
                      $.ajax({
                          url: 'https://api.spotify.com/v1/users/' + response.id + '/playlists',
                          headers: {
                            'Authorization': 'Bearer ' + access_token
                          },
                          success: function (res) {
                              //callback(response);
                              $('#login').hide();
                              $('#loggedin').show();
                              $('#loggedin .name').html(response.display_name);
                              $('#loggedin img').attr('src',String(response.images[0].url));
                              for(var i = 0; i < res.items.length; i++) {
                                var playlist = '<div class="playlist">' + res.items[i].name + '</div>';
                                $('#playlists').append(playlist);
                                console.log('test');
                              }
                              console.log(res);
                          }
                      });
                  console.log(response);
                }
            });
          } else {
              // render initial screen
              $('#login').show();
              $('#loggedin').hide();
              $('#loggedin .name').html('');
          }

          $('#login').click(function() {
            window.location.href = '/login';
          });

        }

}

function getHashParams() {
          console.log('test2');
          var hashParams = {};
          var e, r = /([^&;=]+)=?([^&;]*)/g,
              q = window.location.hash.substring(1);
          while ( e = r.exec(q)) {
             hashParams[e[1]] = decodeURIComponent(e[2]);
          }
          return hashParams;
        }