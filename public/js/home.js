var playlists = {};
var prevplayer;
var userPlaylists = {};
var songs;
var controlTimeout;
var prevHTML;

$(document).ready(function() {

	$('#vidBackground').prop('volume',0);

	$(document).on("mousedown", ".playSong", blockClick);
	$(".playSong.mobile").click(playSong);

	if($('.block.inactive').length > 0) {
        videoEnter($('.block.inactive'), 0);
	}
	spotify();
	$(document).on("click","#spotifyLogin", function() {
        spotifyLogin();
    });

	$('#vgenre').mouseenter(function() {
		if(!$('#genreBar').hasClass('active')) {
			$('#genreBar').toggleClass('active');
			$('#content').toggleClass('genre');
		}
	});
	$('#navbar').mouseleave(function() {
		if($('#genreBar').hasClass('active')) {
			$('#genreBar').toggleClass('active');
			$('#content').toggleClass('genre');
		}
	});
	$('#vgenre').click(function() {
		$(this).toggleClass('pinned');
		$('#genreBar').toggleClass('pinned');
		$('#content').toggleClass('genrePinned');
	});

	$('#vfilter .dtitle').click(function() {
		if($('#vfilter').hasClass('filtered')) {
			$('#vfilter .searched').removeClass('searched');
			$('#vfilter').removeClass('filtered');
			var params = searchParams();
			searchDB(params);
		}
	});

	$('#fullScreenWrapper').click(function() {
		// $.get('/checkViews', function(res) {
		// 	console.log(res);
		// });
		toggleFullScreen(document.body);
	});

	$.getScript("https://www.youtube.com/iframe_api", function() {});
 	$.getScript("https://apis.google.com/js/client.js?onload=googleApiClientReady", function() {});

	$('body').on('click','.nav', function(e) {
		nav(e);
	});
	$('html').keyup(function(e) {
		videoHandler(e);
	});

	$('#player #playerCollapse').click(function() {
		$('#player').removeClass('active');
	});

    $('#controls #playToggleSelection').click(function() {
    	if($(this).hasClass('active')) {
    		player.pauseVideo();
    		$('#controls #playToggleSelection').removeClass('active');
    	} else {
    		player.playVideo();
    		$('#controls #playToggleSelection').addClass('active');
    	}
    });
    $('#controls #playerExpand').click(function() {
    	if($('#player').attr('data-vid') != '-')
    		$('#player').addClass('active');
    	$('.playerOptions').addClass('active');
    	setTimeout(function() {
			$('.playerOptions').removeClass('active');
			$('#videoPlayer').css('pointer-events','none');
		}, 2000);
    });

    $('#myListsToggle').click(function() {
    	showUserLists();
    });

    $('body').on('mouseover', '#userListsNav', function() {
    	$('#userListsNav').addClass('active');
    	$('#songOrder').css('display','none');
    });
    $('body').on('mouseleave', '#userListsNav', function() {
    	$('#userListsNav').removeClass('active');
    });
    $('body').on('mouseover', '.listNav', function() {
    	$(this).addClass('active');
    });
    $('body').on('mouseleave', '.listNav', function() {
    	$(this).removeClass('active');
    });
    $('body').on('change', '#listNameInput', function() {
    	var name = $('#listNameInput').val();
    	var lid = $('#listBanner').attr('data-lid');
    	updateListName(name, lid);
    });
    $('body').on('change', '.blogEntryTextInput', function(event) {
    	var name = $(event.target).closest('.blogEntry').find('.blogEntryTextInput').val();
    	var bid = $(event.target).closest('.blogEntry').attr('data-id');
    	updateBlogText(name, bid);
    });
    $('body').on('change', '.InterviewEntryTextInput', function(event) {
    	var name = $(event.target).closest('.blogEntry').find('.InterviewEntryTextInput').val();
    	var bid = $(event.target).closest('.blogEntry').attr('data-id');
    	updateInterviewText(name, bid);
    });


    $(document).on("click",".vItem", function(event) {
    	searchCriteriaToggle(event);
    });
    $(document).on("click",".dItem", function(event) {
    	searchCriteriaToggle(event);
    });
    $(document).on("click",".gItem", function(event) {
    	searchCriteriaToggle(event);
    });

    $(document).on("click",".query", function(e) {
    	var params = searchParams();
		searchDB(params);
    });

    $(window).scroll(function() {
	   if($('#content').scrollTop() == $('#content').height()) {
	       alert("bottom!");
	   }
	});
	var playerControls = function() {
		if($('#player').hasClass('active')) {
			if(!$('#nextSong').hasClass('active')) {
				$('.playerOptions').addClass('active');
				$('#videoPlayer').css('pointer-events','all');
			} else {
				clearTimeout(controlTimeout);
			}
			controlTimeout = setTimeout(function() {
				$('.playerOptions').removeClass('active');
				$('#videoPlayer').css('pointer-events','none');
			}, 2000);
		}
	};

	var mobilePlayerControls = function() {
		if($('#player').hasClass('active')) {
			if(!$('#nextSong').hasClass('active')) {
				$('.mobilePlayerOptions').addClass('active');
				$('#videoPlayer').css('pointer-events','all');
			} else {
				clearTimeout(controlTimeout);
			}
			controlTimeout = setTimeout(function() {
				$('.mobilePlayerOptions').removeClass('active');
				$('#videoPlayer').css('pointer-events','none');
			}, 2000);
		}
	};

	$('#player').on('mousemove',playerControls);
	$('#player').on('click',mobilePlayerControls);

	$('.playerOptions').hover(function() {
		$('#player').off('mousemove',playerControls);
		clearTimeout(controlTimeout);
	}, function() {
		$('#player').on('mousemove',playerControls);
		controlTimeout = setTimeout(function() {
			$('.playerOptions').removeClass('active');
			$('#videoPlayer').css('pointer-events','none');
		}, 2000);
	});

	$('.mobilePlayerOptions').hover(function() {
		$('#player').off('click',mobilePlayerControls);
		clearTimeout(controlTimeout);
	}, function() {
		$('#player').on('click',mobilePlayerControls);
		controlTimeout = setTimeout(function() {
			$('.mobilePlayerOptions').removeClass('active');
			$('#videoPlayer').css('pointer-events','none');
		}, 2000);
	});

	$('#nextSong').click(function() {
		nextSong();
	});
	$('#previousSong').click(function() {
		prevSong();
	})
	$('#blogs').removeClass('inactive');
	$('#shuffle').click(function() {
		$(this).toggleClass('active');
		songOrder();
	});
	$('#repeat').click(function() {
		$(this).toggleClass('active');
	});
	$('#songArtist').click(function() {
		$('#player').removeClass('active');
		artistSearch($(this).attr('data-artist-id'), $(this).html());
	});
	$('#songPlaylist').click(function() {
		$('#player').removeClass('active');
		var $html = buildSongs(currentList);
		var time = transition();
        	videoEnter($html, time);
		currentlyPlaying($('#player').attr('data-vid'));
	});

	// $(document).on("click","#searchVideos", function() {
	// 	$('#navbar').removeClass('home');
	// 	$('#controls').removeClass('home');
	// 	var params = homeSearchParams();
	// 	searchDB(params);
	// });

	if($('.spotifyImporting').length > 0) {
		checkImportStatus();
	}
});

function checkImportStatus() {
	console.log('checking');
	$.get("/checkImport", function(res) {
		if(!res.html) {
			setTimeout(function() {
				checkImportStatus();
			},2000);
		} else {
			console.log(res.html);
			$('.spotifyImporting').remove();
			$('#spotifyControls').append(res.html);
		}
	});
}

function nav(e) {
	$('.selected').removeClass('selected');
	var $button = $(e.target).closest('.nav');
	$(e.target).closest('.nav').addClass('selected');
	var nav = $(e.target).closest('.nav').attr('id');
	var pos_x = $('.nav').css('')
	$('.nav').removeClass('active');
	$(e.target).closest('.nav').addClass('active');
	$('#navbar').removeClass('home');
	$('#userListsNav').removeClass('home');
	$('#controls').removeClass('home');
	setTimeout(function() {
		switch(nav) {
		case 'songs':
			$.get('/songs/d', function(res) {
				$('#content').html(res);
				$('#content').append($('<input type="text" id="videoSearch">'));

			});
			break;
		case 'lists':
			$.get('/playlists/d', function(res) {
				$('#content').html(res);
				$.get('/playlistmodel', function(m) {
					playlists = m;
					$('.block').click(showList);
				})
			});
			break;
		case 'blog':
			$.get('/blogs/d', function(res) {
				$('#genreBar .searched').removeClass('searched');
				$('#genreBarSelect').css('opacity',0);
				clearSearch();
				var time = transition();
        		pageEnter(res, time);
			});
			break;
		case 'myLists':
				$.get('/myLists/d', function(res) {
					clearSearch();
					var time = transition();
        			pageEnter(res.html, time);
				});
			break;
		case 'title':
			$.get('/blogs/d', function(res) {
				var time = transition();
				$('#navbar').addClass('home');
				clearSearch();
        		pageEnter(res, time);
			});
			break;
		}
	},200);
}
function loadSongs(res) {
	var lists = $('<div id="playlists"></div>');
	setTimeout(function() {
		$('#content').empty().append(lists);
		renderSongs(res);
	}, 200);
}
function loadPlaylists(res) {
	console.log(res);
	var lists = $('<div id="playlists"></div>');
	setTimeout(function() {
		$('#content').empty().append(lists);
		renderLists(res);
	}, 200);
}
function loadMyLists() {
	var lists = $('<div id="spotifyLogin"><span>Login to Spotify</span></div>');
	setTimeout(function() {
		$('#content').empty().append(lists);
		$('#spotifyLogin span').click(function() {
            window.location.href = '/login';
          });
		$('#spotifyLogin').animate({
			opacity: '1'
		},100);
	}, 200);
}

// function loadBlogs(res) {
// 	var blogs = $('<div id="blogs">'+res[0].text+'</div>');
// 	$('#content').empty().append(blogs);
// 	console.log(res);
// }

function renderSongs(songs) {
	var ids = [];
	for(var i = 0; i < songs.length; i++) {
		var description = $('<div class="description"><span class="name">'+songs[i].name+'</span><span class="glyphicon glyphicon-play-circle"></span></div>');
		if(String(songs[i].vid) == String($('#player').attr('data-vid'))) {
			description.addClass('playing');
			console.log('successful');
		}
		var thumb = $('<div id="s'+i+'" class="playlist" data-id="'+songs[i].id+'" data-vid="'+songs[i].vid+'"><img src="http://img.youtube.com/vi/'+songs[i].vid+'/0.jpg" class="list song"/></div>');
		//var list = $('<div data-id="'+lists[i].id+'" class="list"></div>');
		thumb.append(description);
		thumb.css('left',(i+1%5)*50);
		$("#playlists").append(thumb);
		ids.push('#s'+i);
	}
	listAnimate();

	$('#playlists .playlist').click(playSong);
}

function renderLists(lists) {
	playlists = lists;
	for(var i = 0; i < lists.length; i++) {
		var id = lists[i].thumbnail;
		var description = $('<div class="description"><span class="name">'+lists[i].name+'</span></div>');
		var thumb = $('<div class="playlist" data-id="'+lists[i].id+'"><img src="http://img.youtube.com/vi/'+id+'/0.jpg" class="list"/></div>');
		//var list = $('<div data-id="'+lists[i].id+'" class="list"></div>');
		thumb.append(description);
		thumb.css('left',(i+1%5)*50);
		$("#playlists").append(thumb);
	}
	listAnimate();
	$('#playlists .playlist').click(showList);
}

//  function showList() {
//  	if($(this).find('.listDelete').length > 0) {
//  		$('<div id="listEdit" onclick="enableEdit()">EDIT</div>').appendTo($('#listDetails'));
//  	}
// 	$('#overlay').addClass('active');
// 	$('#listDetails').removeClass('hidden');
// 	console.log(playlists);
// 	var id = parseInt($(this).attr('data-num'));
//  	var videos = playlists[id].videoids.split(',');
//  	console.log(playlists[id]);
// 	var vnames = playlists[id].vnames.split(',');
// 	var artists = playlists[id].artists.split(',');
// 	$('#listDetails').attr('data-listid',playlists[id].id);
// 	var title = $('<span class="listName">'+playlists[id].name+'</span>');
// 	var play = $('<span class="glyphicon glyphicon-play-circle"></span>');
// 	$('#listTitle').append(play);
// 	$('#listTitle').append(title);
// 	for(var i = 0; i < videos.length; i++) {
// 		var nameCan = $('<div class="song" data-id="'+videos[i]+'" id="name'+i+'"><span>'+vnames[i]+'</span><span>'+artists[i]+'</span></div>');
// 		$('#songList #buffer').before(nameCan);
// 	}
// 	$('#cover').removeClass('play');
// 	$('#songList').addClass('active');
// }

function showList(el) {
	var lid = $(el).attr('data-lid');
	console.log(lid);
	var name = ($(el).find('.name').length > 0 ? $(el).find('.name').html() : $(el).html());
	$.ajax({
		url: "/showList",
	    type: "post",
	    dataType: "json",
	    data: JSON.stringify({ lid: lid, user_id: $(el).attr('data-user'), back: $('#myListsBanner').attr('data-type') }),
	    contentType: "application/json",
	    cache: false,
	    timeout: 5000,
        success:function(res) {
			var time = transition();
			console.log(res);
			videoEnter(res.html, time);
	    }
	});
}

function hideList() {
	$('#overlay').removeClass('active');
	$('#cover').addClass('play');
	$('#videoList div[id^="can"]').remove();
	$('#prevPlayer').removeClass('active');
	$('#player').removeClass('active');
	$('#coverPlayer').removeClass('active');
	$('#songList .song').remove();
	$('#songList').removeClass('active');
	$('#songList #songSelector').css('height','0px');
	$('#listTitle').empty();
	$('#listEdit').remove();
	$('#listDetails').addClass('hidden');
	prevplayer.stopVideo();
}

function playList(e) {
	if($(e.target).closest('.song').length == 0)
		var video = $('#name0');
	else 
		var video = $(e.target).closest('.song');
	var vid = String(video.attr('data-id'));
	$('#player').attr('data-vid',vid);
	if(video.hasClass('playing')) {
		$('#player').addClass('active');
		player.playVideo();
	} else {
		prevplayer.stopVideo();
		player.loadVideoById(vid,0,"large").setVolume(100);
	}
	$('.song.playing').removeClass('playing');
	$('#player').addClass('active');
	video.addClass('playing');
}

function moveSelector(e) {
	var songblock = $(e.target).closest('.song');
	// if(!songblock.hasClass('playing')) {
		$('#prevPlayer').addClass('active');
		$('#cover').removeClass('play');
		var vid = String($(e.target).closest('.song').attr('data-id'));
		prevplayer.loadVideoById(vid,30,"large").setVolume(0);
	// } else {
	// 	$('#prevPlayer').removeClass('active');
	// }
	var height = songblock.css('height');
	var pos_y = songblock.position().top + $('#songList').scrollTop();
	$('#songList #songSelector').css('top',pos_y).css('height',height);
}

function insertSong() {
		var vid = $("#url").val().split("v=")[1];
		if(vid.indexOf('&') > -1)
			vid = vid.split('&')[0];
		var genre = ', ' + ($('#inputGenre1').val() == null ? '' : $('#inputGenre1').val().toLowerCase() + ', ');
		genre += ($('#inputGenre2').val() == null ? '' : $('#inputGenre2').val().toLowerCase() + ', ');
		genre += ($('#inputGenre3').val() == null ? '' : $('#inputGenre3').val().toLowerCase()) +',';
		if($('.spotifyMatchEntry.active').length > 0) {
			var name = $('.spotifyMatchEntry.active').attr('data-spotifyname');
			var artist = $('.spotifyMatchEntry.active').attr('data-spotifyartist');
			var spotify_id = $('.spotifyMatchEntry.active').attr('data-spotifyid');
			var pop = $('.spotifyMatchEntry.active').attr('data-spotifypop');
			var energy = $('.spotifyMatchEntry.active').attr('data-energy');
			var danceability = $('.spotifyMatchEntry.active').attr('data-danceability');
			var key = $('.spotifyMatchEntry.active').attr('data-key');
			var loudness = $('.spotifyMatchEntry.active').attr('data-loudness');
			var mode = $('.spotifyMatchEntry.active').attr('data-mode');
			var speechiness = $('.spotifyMatchEntry.active').attr('data-speechiness');
			var acousticness = $('.spotifyMatchEntry.active').attr('data-acousticness');
			var instrumentalness = $('.spotifyMatchEntry.active').attr('data-instrumentalness');
			var liveness = $('.spotifyMatchEntry.active').attr('data-liveness');
			var valence = $('.spotifyMatchEntry.active').attr('data-valence');
			var tempo = $('.spotifyMatchEntry.active').attr('data-tempo');
		} else {
			var name = $('#inputName').val();
			var artist = $('#inputArtist').val();
			var spotify_id = 0;
			var pop = 0;
			var energy = 0;
			var danceability = 0;
			var key = 0;
			var loudness = 0;
			var mode = 0;
			var speechiness = 0;
			var acousticness = 0;
			var instrumentalness = 0;
			var liveness = 0;
			var valence = 0;
			var tempo = 0;
		}
		var spotify_ids = [];
		$('.spotifyMatchEntry').each(function() {
			if($(this).attr('data-spotifyname') == name && $(this).attr('data-spotifyartist') == artist) {
				spotify_ids.push($(this).attr('data-spotifyid'));
			}
		});
		console.log(spotify_ids);
		$.ajax({
			url: "/storeSong",
	        type: "post",
	        dataType: "json",
	        data: JSON.stringify({vid: vid, name: name, artist: artist, genre: genre, director: $('#inputDirector').val(), spotify_id: spotify_id, spotify_ids: spotify_ids, pop: pop, energy: energy, danceability: danceability, key: key, loudness: loudness, mode: mode, speechiness: speechiness, acousticness: acousticness, instrumentalness: instrumentalness, liveness: liveness, valence: valence, tempo: tempo}),
	        contentType: "application/json",
	        cache: false,
	        timeout: 5000,
	        success:function(res) {
	        	console.log($('.blogInputText').val());
	        	if($('.blogInputText').val().length > 0) {
	        		insertBlog(vid, name, artist);
	        	}
	        	console.log(res);
				$('#songInput input').val('');
				$('#spotifyMatchList').html('');
		    }
		});
}

function insertBlog(vid, name, artist) {
		if(vid.indexOf('&') > -1)
			vid = vid.split('&')[0];
		var dt = new Date($.now());
		var stamp = dt.getFullYear() + '-' + String(dt.getMonth()+1) + '-' + dt.getDate() +' '+ dt.getHours() + ':' + dt.getMinutes() +':'+ dt.getSeconds();
		//var data = id + ']&[' + $('#inputBlogName').val() + ']&[' + $('#inputBlogArtist').val() + ']&[' + $('#inputBlogDirector').val() + ']&[' + $('#inputText').val() + ']&[' + stamp + ']&[' + al + ']&[' + dl;
		$.ajax({
			url: "/storeBlog",
	        type: "post",
	        dataType: "json",
	        data: JSON.stringify({vid: vid, name: name, artist: artist, director: $('#inputDirector').val(), text: $('#inputText').val(), stamp: stamp, al: $('#inputArtistLink').val(), dl: $('#inputDirectorLink').val()}),
	        contentType: "application/json",
	        cache: false,
	        timeout: 5000,
	        success:function(res) {
	        	$('.blogInputText').val('');
	        	console.log('hey');
		    }
		});
}

function loadBlogs() {
	console.log('noooo');
	$('#blogs img').each(function() {
		var img = new Image();
		img.src = $(this).attr('src');
		console.log($(this).attr('src'));
		 console.log(img.naturalWidth);
		if (typeof img.naturalWidth !== "undefined" && img.naturalWidth === 0) {
	        console.log('no image');
	    }
	});
}

function replaceImg(e) {
	console.log('error catch');
	var vid = $(e.target).closest('.playSong').attr('data-vid');

	$(e.target).attr('src', "http://img.youtube.com/vi/"+vid+"/0.jpg").addClass('blogPicAdjust');
}

function accountSignUp(e) {
	if($(e.target).hasClass('active')) {
			$('#accountSignUp').html('Create Account');
			if($('#account #user').val() != '' && $('#account #password').val() != '' && $('#accout #email').val() != '') {
				if($('#account #email').val().indexOf('@') == -1) {
					alert('Please enter a valid email address');
				} else {
					$.ajax({
						url: "/signUp",
				        type: "post",
				        dataType: "json",
				        data: JSON.stringify({user: encodeURIComponent($('#account #user').val()), password: encodeURIComponent($('#account #password').val()), email: encodeURIComponent($('#account #email').val())}),
				        contentType: "application/json",
				        cache: false,
				        timeout: 5000,
				        success:function(res) {
				        	console.log(res.html);
						       	$.get('/myLists', function(res) {
								loginNav();
								$('#content').html(res.html);
							});
					    },
					    error: function(res) {
					    	alert('User Already Exists.');
					       	$('.signUp').val('');
					    }
					});
				}
			} else {
				alert('All fields must be filled in.');
			}
	} else {
		$('#account .active').removeClass('active');
		$(e.target).addClass('active');
		$('#account #email').removeClass('inactive');
	}
}

function accountLogin(e) {
	console.log(encodeURIComponent($('#account #user').val()));
	if($(e.target).hasClass('active')) {
		$.ajax({
			url: "/login",
	        type: "post",
	        dataType: "json",
	        data: JSON.stringify({user: encodeURIComponent($('#account #user').val()), password: encodeURIComponent($('#account #password').val())}),
	        contentType: "application/json",
	        cache: false,
	        timeout: 5000,
	        success:function(res) {
	        	console.log(res);
		       	var time = transition();
        		pageEnter(res.html, time);
        		loginNav();
		    },
		    error: function(res) {
		    	console.log('what???');
		    	alert('User Not Found.');
		       	$('#account #user').val('');
		       	$('#account #password').val('');
		    }
		});
	} else {
		$('#account .active').removeClass('active');
		$(e.target).addClass('active');
		$('#account #email').addClass('inactive');
	}
}

function loginNav() {
	$.ajax({
		url: "/getLoginNav",
	    type: "get",
	    dataType: "json",
        contentType: "application/json",
        cache: false,
        timeout: 5000,
        success:function(res) {
        	$('#userListsNav').remove();
        	console.log(res);
        	$('#mainBar').append(res.html);

        }
    });
}

function logout() {
	$.get('/logout', function() {
		$.get('/myLists', function(res) {
			var time = transition();
        	pageEnter(res.html, time);
        	loginNav();
		});
	});
}

function createList() {
	if($('#createListName').val() != '') {
		$.ajax({
			url: "/createList",
	        type: "post",
	        dataType: "json",
	        data: JSON.stringify({listName: $('#createListName').val()}),
	        contentType: "application/json",
	        cache: false,
	        timeout: 5000,
	        success:function(res) {
	        	$('#createListName').val('');
	        	console.log(res);
	        	var list = $('<div class="block" data-lid="'+res.m.id+'"><div class="description"><span class="name">'+res.m.name+'</span><div class="listDelete" onclick="promptListDelete(event)">&#215</div></div></div>');
	        	list.css('width','0px').css('border','none');
	        	$('#addList').before(list);
	        	list.animate({
	        		width: '20%'
	        	}, 200, function() {
	        		list.css('border','1px solid #000');
	        		loginNav();
	        	});
		    },
		    error: function(res) {
		    	console.log(res);
		    	alert('Could not create the playlist. That name may already be taken.');
		       	$('#createListName').val('');
		    }
		});
	} else {
		alert('Please enter a playlist name.');
	}
}

function highlight(e) {
	$(e.target).closest('.saveList').css('background-color','#444');
}
function unhighlight(e) {
	$(e.target).closest('.saveList').css('background-color','#000');
}

function saveSong(e, song) {
	$(e.target).closest('.saveList').toggleClass('on');
	setTimeout(function() {
		$(e.target).closest('.saveList').toggleClass('on');
	},100);
	setTimeout(function() {
		$('#userSaveLists').css('left','-20%');
	},200);
	$.ajax({
		url: "/saveSong",
	    type: "post",
	    dataType: "json",
        data: JSON.stringify({list: $(e.target).closest('.saveList').find('.saveListName').text(), vid: song.attr('data-vid'), song: song.find('.name').text(), artist: song.find('.artist').text()}),
        contentType: "application/json",
        cache: false,
        timeout: 5000,
        success:function(res) {
        }
    });
}

function removeSaveList() {
	$('#saveLists').animate({
		height: '0px'
	}, 100, function() {
		$('#saveLists').remove();
	});
}

function blockClick(e) {
	e.stopPropagation();
	e.preventDefault();
	if($(e.target).closest('.mobile').length > 0) {
		return;
	} else {
		if($(e.target).closest('.listDelete').length == 0) {
			var block = $(e.target).closest('.block');
			var count = 0;
			var $e = e;
			$('body').on("mousemove",function(e) {
				if(count == 0) {
					var $drag = $('<div id="blockDragger"></div>');
					var vid = block.attr('data-vid');
					$('.saveList').each(function(index, element) {
						var vids = $(this).attr('data-vids');
						if(vids.search(vid) >= 0) {
							$(this).addClass('included');
						}
					});
					block.addClass('dragging');
					if($('#listBanner input').length > 0) {
						block.append($('<div id="songOrder" style="display:none;"></div>'));
						$('.block.edit').on('mouseenter', listOrderChange);
					}
		        	$drag.css('left',e.pageX).css('top',e.pageY).css('width','0px').css('height','0px').css('opacity','1').css('border-radius','10px');
					$('body').append($drag);
					$('#userSaveLists').css('left','0px');
				} else {
					$('#blockDragger').css('left',e.pageX-15).css('top',e.pageY-15).css('border-width','15px').css('border-radius','15px');
				}
				count++;
			}).on("mouseup",function(e) {
				if($(e.target).closest('.saveList').length > 0) {
					saveSong(e, block);
				} else {
					$('#userSaveLists').css('left','-20%');
					$('.included').removeClass('included');
				}
				$('#blockDragger').remove();
				block.removeClass('dragging');
				$('.block.edit').off('mouseenter', songOrder);
				handleDrop(e, block);
				if($('#player').attr('data-lid') == block.closest('#videos').attr('data-lid')) {
					var index = buildCurrentList($('#player').attr('data-vid'));
					updateVidInfo(index);
				}
				$('#songOrder').remove();
				$('body').off("mousemove").off("mouseup");
				if(count == 0) {
					playSong($e);
				}
			});
		}
	}
}

function handleDrop(e, block) {
	if($('#listBanner input').length > 0 && $(e.target).closest('.block').length > 0) {
		$('#songOrder').closest('.block').before(block);
		updateListOrder();
	} else if($(e.target).closest('.listNav').length > 0) {
		console.log($(e.target).closest('.listNav').attr('data-lid'));
		addToPlaylist(block.attr('data-vid'), block.attr('id').replace('s',''), $(e.target).closest('.listNav').attr('data-lid'));
		likeSong(block.attr('data-vid'));
	}
}

function addToPlaylist(vid, song_ID, lid) {
	$.ajax({
		url: "/addToList",
	    type: "post",
	    dataType: "json",
	    data: JSON.stringify({vid: vid, song_ID: song_ID, lid: lid}),
        contentType: "application/json",
        cache: false,
        timeout: 5000,
        success:function(res) {
        	console.log('success');
        }
    });
}

function listOrderChange(e) {
	$('#songOrder').css('display','block');
	$(e.target).closest('.block').append($('#songOrder'));
}

function blockDrag(e) {
	console.log('dragging');
	e.stopPropagation();
	e.preventDefault();
	var $drag = $('<div id="blockDragger"></div>');
	var block = $(e.target).closest('.block');
	var pos_y = block.position().top + $('#content').scrollTop(),
        pos_x = block.position().left;
    var height = block.height();
    var width = block.width();
    block.css('top',pos_y).css('left',pos_x).css('width',width).css('height',height);
}

function showUserLists() {
	if($('#myListsToggle').hasClass('active')) {
		$('#myListsToggle').removeClass('active');
		$('#userSaveLists').css('left','-20%');
	} else {
		$('#myListsToggle').addClass('active');
		$('#userSaveLists').css('left','0%');
	}
}
function promptListDelete(e) {
	e.stopPropagation();
	e.preventDefault();
	var block = $(e.target).closest('.block');
	var overlay = $('<div class="promptOverlay"><div class="promptDelete" data-lid="'+ $(e.target).closest('.block').attr('data-lid') +'"><div id="promptDeleteText">Are you sure you would like to delete the playlist?</div><div id="promptDeleteYes">YES</div><div id="promptDeleteNo">NO</div></div></div>');
	$('body').append(overlay);
	$('.promptDelete').animate({
		top: '50%'
	}, 200);
	$('.promptOverlay').click(function(event) {
		console.log($(event.target).closest('.promptDelete'));
		if($(event.target).closest('.promptDelete').length == 0) {
			$('.promptOverlay').remove();
		}
	});
	$('#promptDeleteNo').click(function() {
		$('.promptOverlay').animate({
			opacity: '0'
		}, 200, function() {
			$('.promptOverlay').remove();
		});
	});
	$('#promptDeleteYes').click(function(event) {
		$.ajax({
			url: "/deleteList",
		    type: "post",
		    dataType: "json",
	        data: JSON.stringify({listid: $(event.target).closest('.promptDelete').attr('data-lid')}),
	        contentType: "application/json",
	        cache: false,
	        timeout: 5000,
	        success:function(res) {
	        	$('.promptOverlay').animate({
					opacity: '0'
				}, 200, function() {
					$('.promptOverlay').remove();
					block.remove();
					loginNav();
	        	});
	        }
	    });
	});
}

function enableEdit() {
	if($('#listEdit').text() == 'EDIT') {
		var nameEdit = $('<input type="text" id="listNameEdit">');
		$('#listEdit').text('SAVE');
		var name = $('#listTitle .listName').text();
		$('#listTitle .listName').remove();
		console.log(nameEdit);
		$('#listTitle').append(nameEdit);
		nameEdit.val(name);
		$(document).off('click','#listTitle',playList);
		$(document).off('click','.song',playList);
		$(document).off('click','#overlay',hideList);
	} else {
		listEditSave();
		$('#listEdit').text('EDIT');
	}
}

function listEditSave() {
	var listName = $('#listNameEdit').val();
	var artists = '';
	var vids = '';
	var names = '';
	$('#songList .song').each(function(index) {
		names += $(this).find('span').first().text() + ',';
		artists += $(this).find('span').last().text() + ',';
		vids += $(this).attr('data-id') + ',';
	});
	names = names.slice(0,-1);
	artists = artists.slice(0,-1);
	vids = vids.slice(0,-1);
	console.log(listName);
	console.log(artists);
	console.log(vids);
	console.log(names);
	$.ajax({
			url: "/updateList",
		    type: "post",
		    dataType: "json",
	        data: JSON.stringify({listid: $('#listDetails').attr('data-listid'), listName: listName, artists: artists, vids:vids, names:names}),
	        contentType: "application/json",
	        cache: false,
	        timeout: 5000,
	        success:function(res) {
	        	console.log(res);
	        	$('#listNameEdit').remove();
	        	$('<span class="listName">'+ listName +'</span>').appendTo($('#listTitle'));
	        	$('#s'+$('#listDetails').attr('data-listid')).find('.name').text(listName);
	        	$(document).on('click','#listTitle',playList);
				$(document).on('click','.song',playList);
				$(document).on('click','#overlay',hideList);
	        }
	});
}

function updateListOrder(e) {
	var lid = $('#listBanner').attr('data-lid');
	console.log(lid);
	var order = songOrderer();
	$.ajax({
		url: "/updateListOrder",
	    type: "post",
	    dataType: "json",
        data: JSON.stringify({lid: lid, order: order}),
        contentType: "application/json",
        cache: false,
        timeout: 5000,
        success:function(res) {
        	console.log('sucess');
        }
	});
}

function deleteSong(e) {
	e.stopPropagation();
	e.preventDefault();
	e.cancelBubble = true;
	$(e.target).closest('.block').remove();
	updateListOrder(e);
}

function songOrderer() {
	var order = [];
	$('.block').each(function() {
		order.push($(this).attr('data-id'));
	});
	return order;
}

function backToLists() {
	console.log(prevHTML);
	var time = transition();
	pageEnter(prevHTML, time);
}

function updateListName(name, lid) {
	$.ajax({
		url: "/updateListName",
	    type: "post",
	    dataType: "json",
        data: JSON.stringify({name: name, lid: lid}),
        contentType: "application/json",
        cache: false,
        timeout: 5000,
        success:function(res) {
        	loginNav();
        }
	});
}

function updateBlogText(name, bid) {
	$.ajax({
		url: "/updateBlogText",
	    type: "post",
	    dataType: "json",
        data: JSON.stringify({name: name, bid: bid}),
        contentType: "application/json",
        cache: false,
        timeout: 5000,
        success:function(res) {
        }
	});
}

function updateInterviewText(name, bid) {
	$.ajax({
		url: "/updateInterviewText",
	    type: "post",
	    dataType: "json",
        data: JSON.stringify({name: name, bid: bid}),
        contentType: "application/json",
        cache: false,
        timeout: 5000,
        success:function(res) {
        }
	});
}

function currentlyPlaying(vid) {
	console.log(vid);
	$('.block .description.active').removeClass('active');
	$('.block').each(function() {
		if(vid == $(this).attr('data-vid')) {
			console.log(vid);
			$(this).find('.description').addClass('active');
		}
	});
}

function likeSong(vid) {
	$.ajax({
		url: "/likeSong",
	    type: "post",
	    dataType: "json",
        data: JSON.stringify({vid: vid}),
        contentType: "application/json",
        cache: false,
        timeout: 5000,
        success:function(res) {
        	console.log(res);
        }
	});
}

function playerLikeSong(e) {
	$(e.target).closest('#likeSong').find('span').toggleClass('glyphicon-heart-empty');
	$(e.target).closest('#likeSong').find('span').toggleClass('glyphicon-heart');
	$(e.target).closest('#likeSong').attr('onclick', 'playerUnlikeSong(event)');
	var list_id = $('#userListsNav').find('.dItem').first().attr('data-lid');
	var song_id = $('#player').attr('data-id');
	var vid = $('#player').attr('data-vid');
	addToPlaylist(vid, song_id, list_id);
}

function playerUnlikeSong(e) {
	$(e.target).closest('#likeSong').find('span').toggleClass('glyphicon-heart-empty');
	$(e.target).closest('#likeSong').find('span').toggleClass('glyphicon-heart');
	$(e.target).closest('#likeSong').attr('onclick', 'playerLikeSong(event)');
	var list_id = $('#myLists:first-child').attr('data-lid');
	var song_id = $('#player').attr('data-id');
	console.log(song_id);
	$.ajax({
		url: "/playlistSongDelete",
	    type: "post",
	    dataType: "json",
	    data: JSON.stringify({ song_id: $('#player').attr('data-id'), list_id: $('#myLists:first-child').attr('data-lid') }),
	    contentType: "application/json",
	    cache: false,
	    timeout: 5000,
	    success:function(res) {
	    	$(e.target).closest('.playSong').remove();
	    }
	});
}

function unlikeSong(vid) {
	$.ajax({
		url: "/unlikeSong",
	    type: "post",
	    dataType: "json",
        data: JSON.stringify({vid: vid}),
        contentType: "application/json",
        cache: false,
        timeout: 5000,
        success:function(res) {
        	console.log(res);
        }
	});
}

function staffAdd(e) {
	e.stopPropagation();
	e.preventDefault();
	$.ajax({
		url: "/staffAdd",
	    type: "post",
	    dataType: "json",
        data: JSON.stringify({vid: $(e.target).closest('.block').attr('data-vid')}),
        contentType: "application/json",
        cache: false,
        timeout: 5000,
        success:function(res) {
        	$(e.target).closest('.description').append('<div class="staffRemove" onclick="staffRemove(event)">-</div>');
        	$(e.target).closest('.staffAdd').remove();
        }
	});
}

function staffRemove(e) {
	e.stopPropagation();
	e.preventDefault();
	$.ajax({
		url: "/staffRemove",
	    type: "post",
	    dataType: "json",
        data: JSON.stringify({vid: $(e.target).closest('.block').attr('data-vid')}),
        contentType: "application/json",
        cache: false,
        timeout: 5000,
        success:function(res) {
        	$(e.target).closest('.description').append('<div class="staffAdd" onclick="staffAdd(event)">+</div>');
        	$(e.target).closest('.staffRemove').remove();
        }
	});
}

function blogsInterviews() {
	$('#blogsTitleInterviews').addClass('active');
	$('#blogsTitleVideos').removeClass('active');
	$('#blogsTitleMove').removeClass('active');
	blogInterviewshtml();
}
function blogsVideos() {
	$('#blogsTitleVideos').addClass('active');
	$('#blogsTitleInterviews').removeClass('active');
	$('#blogsTitleMove').addClass('active');
	blogVideoshtml();
}

function blogVideoshtml() {
	$.get('/blogVideos', function(res) {
		console.log(res);
		$('#blogsType').html(res.html);
	});
}

function blogInterviewshtml() {
	$.get('/blogInterviews', function(res) {
		console.log(res);
		$('#blogsType').html(res.html);
	});
}

function searchCriteriaToggle(e) {
	var criteria = $(e.target).closest('.criteriaType').attr('id');
    switch(criteria) {
    	case 'sortDrop':
    	case 'vsort':
    		$(e.target).closest('.criteriaType').children().removeClass('searched');
    		$(e.target).closest('.criteria').toggleClass('searched');
    		break;
    	case 'genreBar':
    		// if($(e.target).closest('.criteria').hasClass('searched')) {
    		// 	$(e.target).closest('.criteria').removeClass('searched');
    		// 	$(e.target).closest('.criteria').nextAll().removeClass('searched');
    		// } else {
    		// 	$(e.target).closest('.criteria').addClass('searched');
    		// }
    		refreshGenres($(e.target).closest('.gItem'));
    		break;
    	default:
    		$(e.target).closest('.criteria').toggleClass('searched');
    		if($('#vfilter').find('.searched').length) {
    			if(!$('#vfilter').hasClass('filtered')) {
    				$('#vfilter').addClass('filtered');
    			}
    		} else {
    			$('#vfilter').removeClass('filtered');
    		}
    		break;
    }
}

function refreshGenres($el) {
	if(!$el.hasClass('searched')) {
		var left = $el.offset().left;
		var width = $el.width()+10;
		$('#genreBarSelect').css('left',left);
		$('#genreBarSelect').css('width',width);
		$('#genreBarSelect').css('opacity', 1);
		$('.gItem').removeClass('searched');
		$el.addClass('searched');
	} else {
		$('#genreBarSelect').css('opacity',0);
		$('.gItem').removeClass('searched');
	}
}

// function refreshGenres($el) {
// 	var genre = $('#genreBar').find('.searched:last');
// 	if(genre.length) {
// 		genre = genre.attr('data-search');
// 	} else {
// 		genre = '*';
// 	}
// 	var count = $('#genreBar').find('.searched').length;
// 	if($('.gItem:not(.searched)').length > 0) {
// 		$.ajax({
// 			url: "/refreshGenres",
// 		    type: "post",
// 		    dataType: "json",
// 		    data: JSON.stringify({genre: genre, count: count}),
// 		    contentType: "application/json",
// 		    cache: false,
// 	        timeout: 5000,
// 	        success:function(res) {
// 	        	$el.nextAll('.genreCarrot').remove();
// 	        	$('.gItem:not(.searched)').remove();
// 	        	$('#genreBar').append(res.html);
// 	        	if($el.nextAll().length > 0) 
// 	        		$('#genreBar').find('.searched:last').after('<div class="genreCarrot">></div>');
// 		    }
// 		});
// 	}
// }

function genreUpdate() {
	console.log('in');
	$.get("/genreUpdate", function(data) {
      	alert('updated');
    });
}

function spotifyLogin() {
	window.location.href = '/spotifyLogin';
}

function thisWeeksVideos() {
	var params = ["","","pop_week",0,"",0,[0,75]];
	searchDB(params);
}

function recentStaffPicks() {
	var params = ["","staff","pop_week",0,"",0,[0,75]];
	searchDB(params);
}

function danceSearch() {
	var params = ["","","pop_week",0,"",['songs.danceability','songs.danceability>0.7'],[0,75]];
	searchDB(params);
}
function chillSearch() {
	var params = ["","","pop_week",0,"",['songs.loudness','songs.loudness<-12'],[0,75]];
	searchDB(params);
}
function playlistsSearch() {
	$.ajax({
		url: "/playlistsSearch",
	    type: "post",
	    dataType: "json",
	    data: JSON.stringify({sort: 'trending'}),
	    contentType: "application/json",
	    cache: false,
        timeout: 5000,
        success:function(res) {
        	var time = transition();
        	pageEnter(res.html, time);
	    }
	});
}

function spotifyIDUpdate() {
	$.get('/spotifyIDUpdate', function() {
		console.log('success');
	});
}

function showSpotifyList(e) {
	console.log('clicked');
	$.ajax({
		url: "/showSpotifyList",
	    type: "post",
	    dataType: "json",
	    data: JSON.stringify({playlist_id: $(e.target).closest('.spotifyList').attr('data-id')}),
	    contentType: "application/json",
	    cache: false,
        timeout: 5000,
        success:function(res) {
        	console.log(res.m);
        	$('.selected').removeClass('selected');
    		$('#videoSearcherWrapper').addClass('selected');
        	var time = transition();
        	videoEnter(res.html, time, 0, {name: $(e.target).closest('.spotifyList').html(), class: 'spotifyListBanner'});
	    }
	});
}

function spotifyMatchSearch() {
	console.log('in');
	var name = $('#inputName').val();
	var artist = $('#inputArtist').val();
	$.ajax({
		url: "/spotifyMatchSearch",
	    type: "post",
	    dataType: "json",
	    data: JSON.stringify({name: name, artist: artist}),
	    contentType: "application/json",
	    cache: false,
        timeout: 5000,
        success:function(res) {
        	console.log(res);
        	$('#spotifyMatchList').html(res.html);
	    }
	});
}

function spotifyMatchSelect(e) {
	$('.spotifyMatchEntry').removeClass('active');
	if($(e.target).closest('.spotifyMatchEntry').hasClass('active')) {
		$(e.target).closest('.spotifyMatchEntry').removeClass('active');
	} else {
		$(e.target).closest('.spotifyMatchEntry').addClass('active');
	}
}

function spotifyDataUpdate() {
	$.get('/spotifyDataUpdate', function() {
		console.log('success');
	});
}

function artistSearch(artist_id, artist) {
	$.ajax({
		url: "/artistSearch",
	    type: "post",
	    dataType: "json",
	    data: JSON.stringify({ artist: artist }),
	    contentType: "application/json",
	    cache: false,
	    timeout: 5000,
	    success:function(res) {
			var time = transition();
        	videoEnter(res.html, time, 0, {name: artist, class: 'listBanner'});
	    }
	});
}

function playTitleVideo() {
	console.log('loaded');
	$('#vidPlayer').prepend('<video loop muted autoplay><source src="images/muramasa1.mp4" type="video/mp4"></video>');
}

function playlistSongDelete(e) {
	e.stopPropagation();
	e.preventDefault();
	$.ajax({
		url: "/playlistSongDelete",
	    type: "post",
	    dataType: "json",
	    data: JSON.stringify({ song_id: $(e.target).closest('.playSong').attr('data-id'), list_id: $('#listBanner').attr('data-lid') }),
	    contentType: "application/json",
	    cache: false,
	    timeout: 5000,
	    success:function(res) {
	    	$(e.target).closest('.playSong').remove();
	    }
	});
}

function playlistBack(e) {
	if($(e.target).closest('#listBanner').attr('data-back') == 'all') {
		playlistsSearch();
	} else {
		$.get('/myLists', function(res) {
			var time = transition();
        	pageEnter(res.html, time);
		});
	}
}

function makePublic() {
	if($('#listPublic').attr('data-public') == 1) {
		var public = 0;
	} else {
		var public = 1;
	}
		$.ajax({
			url: "/makePublic",
		    type: "post",
		    dataType: "json",
		    data: JSON.stringify({ lid: $('#listBanner').attr('data-lid'), public: public }),
		    contentType: "application/json",
		    cache: false,
		    timeout: 5000,
		    success:function(res) {
		    	if($('#listPublic').attr('data-public') == 1) {
		    		$('#listPublic').html('Make Public');
		    		$('#listPublic').attr('data-public', 0); 
		    	} else {
		    		$('#listPublic').html('Make Private');
		    		$('#listPublic').attr('data-public', 1); 
		    	}
		    }
		});
}

function changeFollow() {
	if($('#followList').attr('data-follow') == 0) {
		followList();
	} else {
		unfollowList();
	}
}

function followList() {
	$.ajax({
		url: "/followList",
	    type: "post",
	    dataType: "json",
	    data: JSON.stringify({ lid: $('#listBanner').attr('data-lid') }),
	    contentType: "application/json",
	    cache: false,
	    timeout: 5000,
	    success:function(res) {
	    	$('#followList').attr('data-follow',1);
	    	$('#followList').html('Unfollow Playlist');
	    	if(res.html) {
	    		var time = transition();
        		pageEnter(res.html, time);
	    	}
	    }
	});
}

function unfollowList() {
	$.ajax({
		url: "/unfollowList",
	    type: "post",
	    dataType: "json",
	    data: JSON.stringify({ lid: $('#listBanner').attr('data-lid') }),
	    contentType: "application/json",
	    cache: false,
	    timeout: 5000,
	    success:function(res) {
	    	$('#followList').attr('data-follow',0);
	    	$('#followList').html('Follow Playlist');
	    	if(res.html) {
	    		var time = transition();
        		pageEnter(res.html, time);
	    	}
	    }
	});
}

function clearSearch() {
	$('#genreBarSelect').css('opacity',0);
	$('#genreBar .searched').removeClass('searched');
	console.log('testing');
	$('#vfilter .searched').removeClass('searched');
	$('#vfilter').removeClass('filtered');
}