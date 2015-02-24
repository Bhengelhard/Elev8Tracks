var playlists = {};
var vheight = 315;
var ratio = 0.5625;
var prevplayer;
var currentPlay;
var currentTime;

$(document).ready(function() {

	spotify();

	$.get('/playlists', function(res) {
		console.log('tester');
		loadPlaylists(res);
	});

	$.getScript("https://www.youtube.com/iframe_api", function() {
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
	$(document).keypress(function(e) {
		videoHandler(e);
	})

});

function nav(e) {
	var nav = $(e.target).closest('.nav').attr('id');
	$('.nav').removeClass('active');
	$(e.target).closest('.nav').addClass('active');
	switch(nav) {
		case 'songs':
			console.log('loading songs');
			$.get('/songs', function(res) {
				loadSongs(res);
			});
			break;
		case 'lists':
			console.log('loading lists');
			$.get('/playlists', function(res) {
				loadPlaylists(res);
			});
			break;
		case 'blog':
			console.log('clicked');
			$.get('/blogs', function(res) {
				loadBlogs(res);
			});
	}
}
function loadSongs(res) {
	var lists = $('<div id="playlists"></div>');
	$('#content').empty().append(lists);
	console.log(res);
	renderSongs(res);
}
function loadPlaylists(res) {
	console.log(res);
	var lists = $('<div id="playlists"></div>'),
		overlay = $('<div id="overlay"></div>'),
		cover = $('<div class="cover play"></div>');
	$('#content').empty().append(lists).append(overlay).append(cover);
	renderLists(res);
}

function loadBlogs(res) {
	var blogs = $('<div id="blogs">'+res[0].text+'</div>');
	$('#content').empty().append(blogs);
	console.log(res);
}

function renderSongs(songs) {
	for(var i = 0; i < songs.length; i++) {
		var description = $('<div class="description"><span class="name">'+songs[i].name+'</span><span class="glyphicon glyphicon-play-circle"></span></div>');
		if(String(songs[i].vid) == String($('#videoPlayer').attr('data-vid'))) {
			description.addClass('playing');
			console.log('successful');
		}
		var thumb = $('<div class="playlist" data-id="'+songs[i].id+'" data-vid="'+songs[i].vid+'"><img src="http://img.youtube.com/vi/'+songs[i].vid+'/0.jpg" class="list song"/></div>');
		//var list = $('<div data-id="'+lists[i].id+'" class="list"></div>');
		thumb.append(description);
		$("#playlists").append(thumb);
	}
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
		$("#playlists").append(thumb);
	}
	$('#playlists .playlist').click(showList);
}

 function showList() {
	$('#overlay').addClass('active');
	var id = parseInt($(this).attr('data-id'))-1;
 	var videos = playlists[id].videoIDs.split(',');
	var vNames = playlists[id].vNames.split(',');
	var artists = playlists[id].artists.split(',');
	var title = $('<span>'+playlists[id].name+'</span>');
	var play = $('<span class="glyphicon glyphicon-play-circle"></span>');
	$('#listTitle').append(play);
	$('#listTitle').append(title);
	for(var i = 0; i < videos.length; i++) {
		var nameCan = $('<div class="song" data-id="'+videos[i]+'" id="name'+i+'"><span>'+vNames[i]+'</span><span>'+artists[i]+'</span></div>');
		$('#songList #buffer').before(nameCan);
	}
	$('.cover').removeClass('play');
	$('#songList').addClass('active');
}

function playSong(e) {
	var vid = $(e.target).closest('.playlist').attr('data-vid');
	if($(e.target).closest('.playlist').find('.description').hasClass('playing')) {
		$('#videoPlayer').addClass('active').attr('data-vid',vid);
		player.playVideo();
	} else {
		var vid = $(e.target).closest('.playlist').attr('data-vid');
		$('.description').removeClass('playing');
		$(e.target).closest('.playlist').find('.description').addClass('playing');
		$('#videoPlayer').addClass('active').attr('data-vid',vid);
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
		      playerVars: { 'autoplay': 1, 'controls': 0 }
    });
    player = new YT.Player('videoPlayer', {
	        videoId: "",
	        events: {
	      	'onReady': onPlayerReady,
	      	'onStateChange': onPlayerStateChange
		      },
		      playerVars: { 'autoplay': 1}
    });
    player.setVolume(100);
}

function hideList() {
	$('#overlay').removeClass('active');
	$('.cover').addClass('play');
	$('#videoList div[id^="can"]').remove();
	$('#prevPlayer').removeClass('active');
	$('#videoPlayer').removeClass('active');
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
	$('#songList').addClass('play');
	$('#listTitle').addClass('play');
	if(video.hasClass('playing')) {
		player.playVideo();
		$('#prevPlayer').removeClass('active');
		$('#overlay').removeClass('active');
	} else {
		prevplayer.stopVideo();
		$('.cover').removeClass('play');
		player.loadVideoById(vid,0,"large").setVolume(100);
		setTimeout(function() {
			$('#prevPlayer').removeClass('active');
			$('#overlay').removeClass('active');
		},200);
	}
	$('.playing').removeClass('playing');
	video.addClass('playing');

}

function moveSelector(e) {
	var songblock = $(e.target).closest('.song');
	if(!songblock.hasClass('playing')) {
		$('#prevPlayer').addClass('active');
		$('#videoPlayer').removeClass('active');
		$('.cover').removeClass('play');
		var vid = String($(e.target).closest('.song').attr('data-id'));
		prevplayer.loadVideoById(vid,30,"large").setVolume(0);
	} else {
		$('#prevPlayer').removeClass('active');
		$('#videoPlayer').addClass('active');
	}
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

}

function onPlayerStateChange(e) {
	var type = $('.nav.active').attr('id');
	if (e.target.getPlayerState() == 1) {
		switch(type) {
			case 'lists':
				var video = $('.playing');
				var height = video.css('height');
				var pos_y = video.position().top + $('#songList').scrollTop();
				$('#songList #songSelector').css('top',pos_y).css('height',height);
		    	$('.cover').addClass('play');
		    	$('#videoPlayer').addClass('active');
		    	break;
		    case 'songs':
		    	// if(!$('#videoPlayer').hasClass('active')) {
		    	// 	$('#videoPlayer').addClass('active')
		    	// }
		    	console.log('testeer');
		    	break;
		}
    } else if (e.target.getPlayerState() == 2) {
    	switch(type) {
    		case 'lists':
	    		if(e.target.getDuration() == e.target.getCurrentTime()) {
		    		var num = parseInt($('.playing').attr('id').split('name')[1]);
		    		num++;
		    		$('.playing').removeClass('playing');
		    		if($('#name'+num).length > 0) {
		    			$('#name'+num).addClass('playing');
			    		var vid = $('#name'+num).attr('data-id');
			    		player.loadVideoById(vid, 0, "large");

		    		} else {
		    			hideList();
		    		}
		    	} else {
		    		$('#songList').removeClass('play');
		    		$('#listTitle').removeClass('play');
					$('#overlay').addClass('active');
		    	}
		    	break;
		    case 'songs':
		    	break;
    	}
    	if(e.target.getDuration() == e.target.getCurrentTime()) {
    		var num = parseInt($('.playing').attr('id').split('name')[1]);
    		num++;
    		$('.playing').removeClass('playing');
    		if($('#name'+num).length > 0) {
    			$('#name'+num).addClass('playing');
	    		var vid = $('#name'+num).attr('data-id');
	    		player.loadVideoById(vid, 0, "large");

    		} else {
    			hideList();
    		}
    	} else {
    		$('#songList').removeClass('play');
    		$('#listTitle').removeClass('play');
			$('#overlay').addClass('active');
    	}
    }
}

function onPrevPlayerStateChange(e) {
	if (e.target.getPlayerState() == 1) {
    	$('.cover').addClass('play');
		$('#prevPlayer').addClass('active');
    }
}

function videoHandler(e) {
	var key = e.keyCode;
	console.log(key);
	switch(key) {
		case 32:
			if($('#videoPlayer').attr('data-vid') != '-') {
				if(player.getPlayerState() == 1) {
					player.pauseVideo();
				} else {
					player.playVideo();
				}
			}
			break;
		case 13:
			if($('#videoPlayer').attr('data-vid') != '-') {
				if($('#videoPlayer').hasClass('active')) {
					$('#videoPlayer').removeClass('active');
				} else {
					$('#videoPlayer').addClass('active');
				}
			}
	}
	e.stopPropagation();
	e.preventDefault();
}