var playlists = {};
var vheight = 315;
var ratio = 0.5625;
var prevplayer;
var currentPlay;
var currentTime;
var searchExecute = false;
var timer;
var userPlaylists = {};

$(document).ready(function() {

	spotify();
	$(document).on("click","#spotifyLogin div", function() {
		console.log('redirect');
        window.location.href = '/login';
    });

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
	$(document).on('click','#overlay',hideList);
	$(document).on('click','.song',playList);
	$(document).on('mouseover','.song',function(e) {
		moveSelector(e);
	});

	$(document).on('click','#listTitle',playList);

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
    	if($('#inputPassword').length > 0) {
	    	if(event.keyCode == 13) {
	    		if($('#inputPassword').val() == "gogetthem") {
	    			$('#constructionBlock').remove();
	    		} else {
					alert('incorrect password');
					$('#inputPassword').val('');
				}
	    	} 
		}
    	if(e.keyCode == 8 && !$(e.target).is("input, textarea")) {
    		e.stopPropagation();
			e.preventDefault();
    	}
    	$('#videoSearch').focus();
    });

    $('#myListsToggle').click(function() {
    	console.log('test');
    	showUserLists();
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
				$('.block').on("mousedown", blockClick);
			});
			$.get('/userPlaylists', function(res) {
				userPlaylists = res;
				fillUserLists();
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
				$('.block').on("mousedown", blockClick);
			});
			break;
		case 'myLists':
			$.get('/myLists', function(res) {
				console.log(res);
				$('#content').html(res);
				$.get('/userPlaylists', function(res) {
					playlists = res;
					$('.block').click(showList);
				});
			});
			//loadMyLists();
			break;
		}
	},200);
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
 	if($(this).find('.listDelete').length > 0) {
 		$('<div id="listEdit" onclick="enableEdit()">EDIT</div>').appendTo($('#listDetails'));
 	}
	$('#overlay').addClass('active');
	$('#listDetails').removeClass('hidden');
	console.log(playlists);
	var id = parseInt($(this).attr('data-num'));
 	var videos = playlists[id].videoids.split(',');
 	console.log(playlists[id]);
	var vnames = playlists[id].vnames.split(',');
	var artists = playlists[id].artists.split(',');
	$('#listDetails').attr('data-listid',playlists[id].id);
	var title = $('<span class="listName">'+playlists[id].name+'</span>');
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
	$('#saveLists').remove();
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
		case 18:
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
		var id = $("#url").val().split("v=")[1];
		if(id.indexOf('&') > -1)
			id = id.split('&')[0];
		var data = id + '&' + $('#inputName').val() + '&' + $('#inputArtist').val();
		$.post("/storeSong/"+data, function() {
			console.log('back');
			$('#songInput input').val('');
		});
}

function insertblog() {
		var id = $("#blogurl").val().split("v=")[1];
		if(id.indexOf('&') > -1)
			id = id.split('&')[0];
		var dt = new Date($.now());
		var stamp = dt.getFullYear() + '-' + String(dt.getMonth()+1) + '-' + dt.getDate() +' '+ dt.getHours() + ':' + dt.getMinutes() +':'+ dt.getSeconds();
		var finder = '/';
		re = new RegExp(finder, "g");
		var al = $('#inputArtistLink').val().replace(re, '^^');
		var dl = $('#inputDirectorLink').val().replace(re, '^^');
		//var data = id + ']&[' + $('#inputBlogName').val() + ']&[' + $('#inputBlogArtist').val() + ']&[' + $('#inputBlogDirector').val() + ']&[' + $('#inputText').val() + ']&[' + stamp + ']&[' + al + ']&[' + dl;
		$.ajax({
			url: "/storeBlog",
	        type: "post",
	        dataType: "json",
	        data: JSON.stringify({id: id, name: $('#inputBlogName').val(), artist: $('#inputBlogArtist').val(), director: $('#inputBlogDirector').val(), text: $('#inputText').val(), stamp: stamp, al: $('#inputArtistLink').val(), dl: $('#inputDirectorLink').val()}),
	        contentType: "application/json",
	        cache: false,
	        timeout: 5000,
	        success:function(res) {
	        	console.log('hey');
		    }
		});
		// $.post("/storeBlog/"+data, function() {
		// 	console.log('back');
		// 	$('#blogInput input').val('');
		// });
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
	animateBlockExit();
	$.ajax({
		url: "/videoSearch",
        type: "post",
        dataType: "json",
        data: JSON.stringify({sval: sval}),
        contentType: "application/json",
        cache: false,
        timeout: 5000,
        success:function(res) {
        	console.log(res);
        	$('#content').append(res.html);
			$('.block').on("mousedown", blockClick);
        }
    });
}

function accountSignUp(e) {
	if($(e.target).html() == "CREATE ACCOUNT") {
		$('.signUp').removeClass('hidden');
		$('#accountSignUp').html('SIGN UP');
	} else {
		$('.signUp').addClass('hidden');
		$('#accountSignUp').html('CREATE ACCOUNT');
		console.log($('#newAccountUser'));
		if($('#newAccountUser').val() != '' && $('#newAccountPassword').val() != '' && $('#newAccountEmail').val() != '') {
			$.ajax({
				url: "/signUp",
		        type: "post",
		        dataType: "json",
		        data: JSON.stringify({user: $('#newAccountUser').val(), password: $('#newAccountPassword').val(), email: $('#newAccountEmail').val()}),
		        contentType: "application/json",
		        cache: false,
		        timeout: 5000,
		        success:function(res) {
			       	$('#content').html(res);
			    },
			    error: function(res) {
			    	alert('User Already Exists.');
			       	$('.signUp').val('');
			    }
			});
		} else {
			alert('All fields must be filled in.');
		}
	}
}

function accountLogin() {
	console.log($('#account #user').val());
	console.log($('#account #password').val());
	$.ajax({
		url: "/login",
        type: "post",
        dataType: "json",
        data: JSON.stringify({user: $('#account #user').val(), password: $('#account #password').val()}),
        contentType: "application/json",
        cache: false,
        timeout: 5000,
        success:function(res) {
        	console.log(res);
	       	$('#content').html(res.html);
	    },
	    error: function(res) {
	    	console.log(res);
	    	alert('User Not Found.');
	       	$('#account #user').val('');
	       	$('#account #password').val('');
	    }
	});
}

function logout() {
	console.log('test');
	$.get('/logout', function(res) {
		$('#content').html(res.html);
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
	        	var list = $('<div class="block" data-id="'+res.id+'"><div class="description"><span class="name">'+res.name+'</span><span class="glyphicon glyphicon-play-circle"></span></div></div>');
	        	list.css('width','0px').css('border','none');
	        	$('#addList').before(list);
	        	list.animate({
	        		width: '20%'
	        	}, 200, function() {
	        		list.css('border','1px solid #000');
	        	});
		    },
		    error: function(res) {
		    	alert('Could not create the playlist. That name may already be taken.');
		       	$('#createListName').val('');
		    }
		});
	} else {
		alert('Please enter a playlist name.');
	}
}

function listMenu(e) {
	$('#saveLists').animate({
		height: '0px'
	}, 100, function() {
		$('#saveLists').remove();
	});
	pos_x = $(e.target).closest('.block').position().left;
	pos_y = $(e.target).closest('.block').position().top + $(e.target).closest('.block').height() + $('#content').scrollTop();
	var saveLists = $('<div id="saveLists"><div id="saveClose" onclick="removeSaveList(event)">&#215</div></div>');
	for(var i = 0; i < userPlaylists.length; i++) {
		var list = $('<div class="saveList"><div class="checkBox"><div class="checkBoxCheck">&#215</div></div><div class="saveListName">'+userPlaylists[i].name+'</div></div>');
		saveLists.append(list);
	}
	saveLists.css('top',pos_y).css('left',pos_x).css('height','0px');
	$('#content').append(saveLists);
	var height = (i+1)*$('.saveList').first().height();
	saveLists.animate({
		height: height
	}, 200);
	$('.saveList').click(function(event) {
		saveSong(event, $(e.target).closest('.block'));
	});
	e.stopPropagation();
	e.preventDefault();
}

function fillUserLists() {
	$('.saveList').remove();
	for(var i = 0; i < userPlaylists.length; i++) {
		var list = $('<div class="saveList" onmousemove="highlight(event)" onmouseout="unhighlight(event)" data-vids="'+userPlaylists[i].videoids+'"><div class="saveListName">'+userPlaylists[i].name+'</div></div>');
		$('#userSaveLists').append(list);
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
		console.log('up');
		$('#blockDragger').remove();
		$('body').off("mousemove").off("mouseup");
		if(count == 0) {
			playSong($e);
		}
	});
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
	var overlay = $('<div class="promptOverlay"><div class="promptDelete" data-listid="'+ $(e.target).closest('.block').attr('data-id') +'"><div id="promptDeleteText">Are you sure you would like to delete the playlist?</div><div id="promptDeleteYes">YES</div><div id="promptDeleteNo">NO</div></div></div>');
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
		console.log($(event.target).closest('.promptDelete').attr('data-listid'));
		$.ajax({
			url: "/deleteList",
		    type: "post",
		    dataType: "json",
	        data: JSON.stringify({listid: $(event.target).closest('.promptDelete').attr('data-listid')}),
	        contentType: "application/json",
	        cache: false,
	        timeout: 5000,
	        success:function(res) {
	        	$('.promptOverlay').animate({
					opacity: '0'
				}, 200, function() {
					$('.promptOverlay').remove();
					block.remove();
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