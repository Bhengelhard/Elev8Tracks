var currentList = [];
var listOrder = [];
var player;

//setup function to load YouTube player
function onYouTubeIframeAPIReady() {
	var vid = $('#player').attr('data-vid');
	prevplayer = new YT.Player('prevPlayer', {
	        videoId: vid,
	        events: {
	      	'onReady': onPrevPlayerReady,
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
		      playerVars: { 'autoplay': 1, 'autohide': 1, 'rel': 0, 'showinfo': 0 }
    });
}

function onPlayerReady(e) {
	e.target.setVolume(100);
	if($('#player').hasClass('active')) {
    	player.loadVideoById($('#player').attr('data-vid'),0,"large");
    }
}
function onPrevPlayerReady(e) {
	e.target.setVolume(0);
}

function onPlayerStateChange(e) {
	var type = $('.nav.active').attr('id');
	//fired when a video starts
	if (e.target.getPlayerState() == 1) {
		$('#videoPlayer').addClass('playing');
		$('#playToggle').addClass('play');
	//fired when a video is paused
    } else if (e.target.getPlayerState() == 2) {
    	$('#playToggle').removeClass('play');
    //fired when a video stops (finishes)
    } else if (e.target.getPlayerState() == 0) {
    	nextSong();
    }
}

function onPrevPlayerStateChange(e) {
	var vid = $('#songOfTheDay').attr('data-vid');
	e.target.loadVideoById({'videoId': vid,
               			  'startSeconds': 30,
               			  'endSeconds': 60,
               			  'suggestedQuality': 'large'});
}

//called when a block (video) is clicked
function playSong(e) {
	$('#controls').removeClass('home');
	//get video id
	var vid = $(e.target).closest('.playSong').attr('data-vid');

	//return to video if the selected song is playing, otherwise load a different video
	// if($(e.target).closest('.playSong').find('.description').hasClass('active')) {
	// 	player.playVideo();
	// } else {
		//build a new playlist to play from
		var index = buildCurrentList(vid);
		//change name, artist, etc. on player
		updateVidInfo(index);
		//highlight block that is currently playing
		currentlyPlaying(vid);
		//load video
		player.loadVideoById(vid,0,"large");
	//}
	$('#player').addClass('active');
	history.pushState({},'','/songs/trending/'+vid);
}

//changes name, artist, etc. on player
function updateVidInfo(index) {
	$('#player #songTitle').html(currentList[index][0]);
	$('#player #playingName').html(currentList[index][0]);
	$('#player #songArtist').html(currentList[index][1]);
	$('#player').attr('data-vid',currentList[index][2]);
	$('#player').attr('data-vidno',index);
	$('#player').attr('data-lid',$('.block').closest('#videos').attr('data-lid'));
}

function nextSong() {
	var playno = playNo('next');
	console.log(playno);
	if(playno != 'stop') {
		var vid = currentList[playno][2];
		updateVidInfo(playno);
		currentlyPlaying(vid);
		player.loadVideoById(vid,0,"large");
	}
}

function prevSong() {
	var playno = playNo('prev');
	var vid = currentList[playno][2];
	updateVidInfo(playno);
	currentlyPlaying(vid);
	player.loadVideoById(vid,0,"large");
}

function playNo(dir) {
	var vidno = parseInt($('#player').attr('data-vidno'));
	var index = jQuery.inArray(vidno,listOrder);
	if(dir == 'next') {
		if(index+1 >= listOrder.length) {
			if($('#player #repeat').hasClass('active')) {
				vidno = listOrder[0];
			} else {
				vidno = 'stop';
			}
		} else {
			vidno = listOrder[index+1];
		}
	} else {
		if(index-1 < 0) {
			vidno = listOrder[0];
		} else {
			vidno = listOrder[index-1];
		}
	}
	return vidno;
}

function buildCurrentList(vid) {
	currentList =[];
	var n = 0,
		num = 0;
	$('.playSong').not('.inactive').each(function() {
		var info = [];
		info.push($(this).attr('data-name'));
		info.push($(this).attr('data-artist'));
		info.push($(this).attr('data-vid'));
		currentList.push(info);
		if(vid == $(this).attr('data-vid')) {
			num = n;
		}
		n++;
	});
	songOrder(num);
	//saves search paramaters for loading additional videos
	listParams = searchParams();
	console.log(currentList);
	return num;
}

function songOrder(num) {
	var len = currentList.length;
	listOrder = [];
	var n = 0;
	while(n < len) {
		listOrder.push(n);
		n++;
	}
	if($('#player #shuffle').hasClass('active')) {
		console.log('test');
		listOrder.splice(num,1);
		listOrder = shuffle(listOrder);
		listOrder.splice(0,0,num);
	}
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex ;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

//******************************************Key Events************************************

function videoHandler(e) {
	var key = e.keyCode;
	//temporary to handle the site password entry
	if($('#inputPassword').length > 0) {
	   	if(event.keyCode == 13) {
	   		if($('#inputPassword').val() == "gogetthem") {
	   			$('#constructionBlock').remove();
	   		} else {
				alert('incorrect password');
				$('#inputPassword').val('');
			}
	   	} 
	//create different actions if the search input is selected
	} else if($('#videoSearcher').is(":focus")) {
		if(key == 13) { 
			var params = searchParams();
		    textSearchDB($('#videoSearcher').val());
		}
	} else {
		switch(key) {
			case 32:
				if($('#player').attr('data-vid') != '-') {
					if(player.getPlayerState() == 1) {
						player.pauseVideo();
					} else {
						player.playVideo();
					}
				}
				break;
			case 13:
				if($('#player').attr('data-vid') != '-') {
					$('#player').toggleClass('active');
				}
				break;
			case 18:
				toggleFullScreen(document.body);
				break;
		}
	}
	e.stopPropagation();
	e.preventDefault();
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
    $('#fullScreenWrapper .glyphicon').toggleClass('glyphicon-resize-full').toggleClass('glyphicon-resize-small');
}

