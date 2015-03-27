var playlists = {};
var vheight = 315;
var ratio = 0.5625;
var prevplayer;
var currentPlay;
var currentTime;
var searchExecute = false;
var timer;

$(document).ready(function() {

	spotify();

	// $.get('/playlists', function(res) {
	// 	loadPlaylists(res);
	// });

	$.getScript("https://www.youtube.com/iframe_api", function() {
 		console.log('success');
 	});
 	$.getScript("https://apis.google.com/js/client.js?onload=googleApiClientReady", function() {
 		console.log('success');
 	});
 	$(document).on('mouseover','#overlay',function() {
		$('#songList #songSelector').css('height','0px');
	});
	$(document).on('click','#overlay',function() {
		hideList();
	});
	$(document).on('click','.song',function(e) {
		playList(e);
	});
	$(document).on('mouseover','.song',function(e) {
		moveSelector(e);
	});
	$(document).on('click','#listTitle',function(e) {
		playList(false);
	});
	$('.nav').click(function(e) {
		nav(e);
	});
	$('.nav#lists').addClass('active');
	$('#navbar #selector').css('left', '17.5%');
	$('html').keyup(function(e) {
		videoHandler(e);
	});

	if($('.block').length > 0) {
		$.get('/playlistmodel', function(m) {
			playlists = m;
			$('.block').animate({
				opacity: 1
			});
			$('#playlists .block').click(showList);
		});
	}
	$('#player .glyphicon-menu-down').click(function() {
		$('#player').removeClass('active');
	});

    $('#controls .glyphicon-play').click(function() {
    	player.playVideo();
    });
    $('#controls .glyphicon-pause').click(function() {
    	player.pauseVideo();
    });
    $('#controls .glyphicon-menu-up').click(function() {
    	console.log('hey');
    	if($('#player').attr('data-vid') != '-')
    		$('#player').addClass('active');
    });
    $(document).on("click","#inputSubmit",function() {
    	insertSong();
    });
    $(document).on("click","#blogSubmit",function() {
    	insertblog();
    });
    $(document).on("click",".remove",function(event) {
    	event.stopPropagation();
		event.preventDefault();
    	removeBlock(event);
    });
    $(document).on("keydown",function(e) {
    	if(e.keyCode == 8 && !$(e.target).is("input, textarea")) {
    		e.stopPropagation();
			e.preventDefault();
    	}
    	$('#videoSearch').focus();
    });
});

function nav(e) {
	var nav = $(e.target).closest('.nav').attr('id');
	var pos_x = $('.nav').css('')
	$('.nav').removeClass('active');
	$(e.target).closest('.nav').addClass('active');
	listRemove(nav);
	setTimeout(function() {
		switch(nav) {
		case 'songs':
			$.get('/songs', function(res) {
				$('#content').html(res);
				$('#content').append($('<input type="text" id="videoSearch">'));
				$('.block').click(playSong);
			});
			break;
		case 'lists':
			$.get('/playlists', function(res) {
				$('#content').html(res);
				$.get('/playlistmodel', function(m) {
					playlists = m;
					$('.block').click(showList);
				})
			});
			break;
		case 'blog':
			$.get('/blogs', function(res) {
				$('#content').html(res);
				$('.block').click(playSong);
			});
			break;
		case 'myLists':
			$.get('/myLists', function(res) {
				$('#content').html(res);
			});
			//loadMyLists();
			break;
		}
	},200)
}
function loadSongs(res) {
	var lists = $('<div id="playlists"></div>');
	listRemove();
	setTimeout(function() {
		$('#content').empty().append(lists);
		renderSongs(res);
	}, 200);
}
function loadPlaylists(res) {
	console.log(res);
	var lists = $('<div id="playlists"></div>');
	listRemove();
	setTimeout(function() {
		$('#content').empty().append(lists);
		renderLists(res);
	}, 200);
}
function loadMyLists() {
	var lists = $('<div id="spotifyLogin"><span>Login to Spotify</span></div>');
	listRemove();
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

function loadBlogs(res) {
	var blogs = $('<div id="blogs">'+res[0].text+'</div>');
	$('#content').empty().append(blogs);
	console.log(res);
}

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

 function showList() {
	$('#overlay').addClass('active');
	console.log(playlists);
	var id = parseInt($(this).attr('data-id'))-1;
 	var videos = playlists[id].videoids.split(',');
	var vnames = playlists[id].vnames.split(',');
	var artists = playlists[id].artists.split(',');
	var title = $('<span>'+playlists[id].name+'</span>');
	var play = $('<span class="glyphicon glyphicon-play-circle"></span>');
	$('#listTitle').append(play);
	$('#listTitle').append(title);
	for(var i = 0; i < videos.length; i++) {
		var nameCan = $('<div class="song" data-id="'+videos[i]+'" id="name'+i+'"><span>'+vnames[i]+'</span><span>'+artists[i]+'</span></div>');
		$('#songList #buffer').before(nameCan);
	}
	$('#cover').removeClass('play');
	$('#songList').addClass('active');
}

function playSong(e) {
	$('.hidePlayer').addClass('active');
	setTimeout(function() {
		$('.hidePlayer').removeClass('active');
	},700);
	var vid = $(e.target).closest('.block').attr('data-vid');
	var name = $(e.target).closest('.block').find('.description .name').text();
	$('#controls #playingName').html(name);
	if($(e.target).closest('.block').find('.description').hasClass('playing')) {
		$('#player').addClass('active').attr('data-vid',vid);
		player.playVideo();
	} else {
		var vid = $(e.target).closest('.block').attr('data-vid');
		$('.description').removeClass('playing');
		$(e.target).closest('.block').find('.description').addClass('playing');
		$('#player').addClass('active').attr('data-vid',vid);
		player.loadVideoById(vid,0,"large");
	}
}

function onYouTubeIframeAPIReady() {
	prevplayer = new YT.Player('prevPlayer', {
	        videoId: "",
	        events: {
	      	'onReady': onPlayerReady,
	      	'onStateChange': onPrevPlayerStateChange
		      },
		      playerVars: { 'autoplay': 1, 'controls': 0, 'rel': 0, 'loop': 1 }
    });
    player = new YT.Player('videoPlayer', {
	        videoId: "",
	        events: {
	      	'onReady': onPlayerReady,
	      	'onStateChange': onPlayerStateChange
		      },
		      playerVars: { 'autoplay': 1, 'autohide': 1, 'rel': 0, 'showinfo': 0}
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
	prevplayer.stopVideo();
}

function playList(e) {
	if(!e)
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

function theaterHide() {
	var scroll = '-=' + String(($(window).height() - vheight)/2) + 'px';
	$('iframe').removeClass('play');
	$('#videoList').animate({
  		scrollTop: scroll
  	},100);
//$('#videoList').css('scrollTop',scroll);
	$('#overlay').removeClass('play');
  	$('#theaterPause').removeClass('play');
  	$('#listTitle').removeClass('play');
  	$('#songList').removeClass('play');
  	$('#videoList #players').empty();
  	vtarget.pauseVideo();
}

function onPlayerReady(e) {
	console.log(player);
	e.target.setVolume(100);
	$('#videoPlayer').click(function() {
		console.log('tester');
	});
}

function onPlayerStateChange(e) {
	var type = $('.nav.active').attr('id');
	if (e.target.getPlayerState() == 1) {
		// switch(type) {
		// 	case 'lists':
		// 		// var video = $('.song.playing');
		// 		// var height = video.css('height');
		// 		// var pos_y = video.position().top + $('#songList').scrollTop();
		// 		// $('#songList #songSelector').css('top',pos_y).css('height',height);
		//     	$('#cover').addClass('play');
		//     	break;
		//     case 'songs':
		//     	break;
		// }
		$('#videoPlayer').addClass('playing');
		$('#playToggle').addClass('play');
    } else if (e.target.getPlayerState() == 2) {
    	console.log(type);
    	switch(type) {
    		case 'lists':
	    		if(e.target.getDuration() == e.target.getCurrentTime()) {
		    		var num = parseInt($('.song.playing').attr('id').split('name')[1]);
		    		num++;
		    		$('.song.playing').removeClass('playing');
		    		if($('#name'+num).length > 0) {
		    			$('#name'+num).addClass('playing');
			    		var vid = $('#name'+num).attr('data-id');
			    		player.loadVideoById(vid, 0, "large");

		    		} else {
		    			$('#player').removeClass('active');
		    		}
		    	} else {
		    		$('#videoPlayer').removeClass('playing');
		    		break;
		    	}
		    	break;
		    case 'songs':
		    	$('#videoPlayer').removeClass('playing');
		    	break;
    	}
    	$('#playToggle').removeClass('play');
    }
}

function onPrevPlayerStateChange(e) {
	if (e.target.getPlayerState() == 1) {
    	$('#cover').addClass('play');
		$('#prevPlayer').addClass('active');
    }
}

function videoHandler(e) {
	var key = e.keyCode;
	console.log(key);
	// if($('#search').is(':focus')) {
	// 	if(key == 13) {
	// 		var query = $(e.target).val() + String.fromCharCode(key);
	// 		var pre = 'https://www.googleapis.com/youtube/v3/search?part=snippet&q=';
	// 		var post = '&videoCaption=closedCaption&type=video&key=AIzaSyBZE6I-CUBBvPFqrZvUWRnslVc-UB3I9bY';
	// 		console.log(query);
	// 			$.get(pre + query + post, function(res) {
	// 				console.log(res);
	// 			});
	// 	}
	// } else {

	switch(key) {
		case 32:
			if($('#player').attr('data-vid') != '-') {
				console.log(key);
				if(player.getPlayerState() == 1) {
					console.log(key);
					player.pauseVideo();
				} else {
					player.playVideo();
				}
			}
			break;
		case 13:
			if($('#player').attr('data-vid') != '-') {
				if($('#player').hasClass('active')) {
					$('#player').removeClass('active');
				} else {
					$('#player').addClass('active');
				}
			}
			break;
		case 102:
			toggleFullScreen(document.body);
			break;
		default:
			if($('#videoSearch').length > 0)
				searchLock();
			break;
	}
	e.stopPropagation();
	e.preventDefault();
	// }
}

function toggleFullScreen(elem) {
    // ## The below if statement seems to work better ## if ((document.fullScreenElement && document.fullScreenElement !== null) || (document.msfullscreenElement && document.msfullscreenElement !== null) || (!document.mozFullScreen && !document.webkitIsFullScreen)) {
    if ((document.fullScreenElement !== undefined && document.fullScreenElement === null) || (document.msFullscreenElement !== undefined && document.msFullscreenElement === null) || (document.mozFullScreen !== undefined && !document.mozFullScreen) || (document.webkitIsFullScreen !== undefined && !document.webkitIsFullScreen)) {
        if (elem.requestFullScreen) {
            elem.requestFullScreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullScreen) {
            elem.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
    } else {
        if (document.cancelFullScreen) {
            document.cancelFullScreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitCancelFullScreen) {
            document.webkitCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

function shuffle(o) {
    for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

function animateBlockExit() {
	$('#videos').remove()
	// var rows = Math.ceil($('.block').length/5);
	// var timeout = 0;
	// var start = 0;
	// var end = 5;
	// console.log(rows);
	// for(var i = 0; i < 5; i++) {
	
	// 		animateBlockRow($('.block').slice(start, end));

	// 	timeout += 50;
	// 	start += 5;
	// 	end += 5;
	// }
	// animateBlockRow($('.block').slice(0, 5));
	// setTimeout(function() {
	// 	console.log($('.block').slice(5));
	// 	$('.block').remove();
	// },400);
}

function animateBlocksRow(bk, num) {
	if(bk.eq(num)) {
		bk.eq(num).animate({
			left: '-=50px',
			opacity: '0'
		},200, function() {
			animateBlocksRow(bk, num++);
		});
	} else {
		return;
	}
}

function animateBlockRow(bk) {
	var timeout = 0;
	// bk.eq(0).animate({
	// 	left: '-=50px',
	// 	opacity: '0'
	// },200);
	for(var i = 0; i < bk.length; i++) {
			bk.eq(i).animate({
				left: '-=50px',
				opacity: '0'
			},200, function() {
				bk.eq(i).remove();
			});
	}
}

function listRemove(nav) {
	var i = $('.block').length;
	num = 1;
	switch(nav) {
		case 'songs':
			$('#navbar #selector').css('left','87.5%');
			break;
		case 'lists':
			$('#navbar #selector').css('left','17.5%');
			break;
		case 'blog':
			$('#navbar #selector').css('left','72.5%');
			break;
		case 'myLists':
			$('#navbar #selector').css('left','2.5%');
			break;
	}
	$('.block').each(function(index, item) {
		$(this).animate({
			left: '+='+Math.floor((num-i)%5)*100,
			opacity: 0
		}, {
			duration: 600,
			easing: "easeOutQuint"
		});
	});
}

function insertSong() {
	if($('#inputPassword').val() == 'gogetthem') {
		var id = $("#url").val().split("v=")[1];
		if(id.indexOf('&') > -1)
			id = id.split('&')[0];
		var data = id + '&' + $('#inputName').val() + '&' + $('#inputArtist').val();
		$.post("/storeSong/"+data, function() {
			console.log('back');
			$('#songInput input').val('');
		});
	} else {
		alert('incorrect password');
		$('#inputPassword').val('');
	}
}

function insertblog() {
	if($('#inputPassword').val() == 'gogetthem') {
		var id = $("#blogurl").val().split("v=")[1];
		if(id.indexOf('&') > -1)
			id = id.split('&')[0];
		var dt = new Date($.now());
		var stamp = dt.getFullYear() + '-' + String(dt.getMonth()+1) + '-' + dt.getDate() +' '+ dt.getHours() + ':' + dt.getMinutes() +':'+ dt.getSeconds();
		var finder = '/';
		re = new RegExp(finder, "g");
		var al = $('#inputArtistLink').val().replace(re, '^^');
		var dl = $('#inputDirectorLink').val().replace(re, '^^');
		var data = id + ']&[' + $('#inputBlogName').val() + ']&[' + $('#inputBlogArtist').val() + ']&[' + $('#inputBlogDirector').val() + ']&[' + $('#inputText').val() + ']&[' + stamp + ']&[' + al + ']&[' + dl;
		$.post("/storeBlog/"+data, function() {
			console.log('back');
			$('#blogInput input').val('');
		});
	} else {
		alert('incorrect password');
		$('#inputPassword').val('');
	}
}

function loadBlogs() {
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
	var vid = $(e.target).closest('.block').attr('data-vid');

	$(e.target).attr('src', "http://img.youtube.com/vi/"+vid+"/maxresdefault.jpg");
}

function removeBlock(e) {
	if($(e.target).attr('data-click') == 0) {
		$(e.target).attr('data-click',1);
		$(e.target).addClass('active');
	} else {
		var data = $(e.target).closest('.block').attr('data-vid');
		$.post('/removeBlock/'+data, function() {
			$(e.target).closest('.block').remove();
		})
	}
}

var lock = 0;
function searchLock() {
	lock++;
	lock = lock%100;
	var key = lock;
	setTimeout(function() {
		if(key == lock) {
			searchDB();
		}
	},500);
}

function searchDB() {
	var sval = $('#videoSearch').val();
	if(!sval)
		sval = '*';
	animateBlockExit();
	$.post('/videoSearch/'+sval, function(res) {
		$('#content').append(res);
		$('.block').click(playSong);
	});
}