var playlists = {};
var vheight = 315;
var ratio = 0.5625;
var prevplayer;
var currentPlay;
var currentTime;
var searchExecute = false;
var timer;
var userPlaylists = {};
var songs;
var controlTimeout;

$(document).ready(function() {

	spotify();
	$(document).on("click","#spotifyLogin div", function() {
		console.log('redirect');
        window.location.href = '/login';
    });

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
		} else if($('#videoSearcherWrapper').hasClass('selected')) {
	    	if(e.keyCode == 8 && !$(e.target).is("input, textarea")) {
	    		e.stopPropagation();
				e.preventDefault();
	    	}
	    	$('.selected').removeClass('selected');
	    	$('#videoSearcherWrapper').addClass('selected');
	    	if($('#videoSearcher').is(":focus")) {
		    	if(e.keyCode == 13) {
		    		var params = searchParams();
					searchDB(params);
		    	}
	    	}
    	}
    });

    $('#myListsToggle').click(function() {
    	console.log('test');
    	showUserLists();
    });

    $('#videoSearcher').click(function() {
    	$('.selected').removeClass('selected');
    	$('#videoSearcherWrapper').addClass('selected');
    });
    $('.vItem').click(function(e) {
    	if($(e.target).closest('#vsort').length > 0) {
    		console.log('vsort');
    		$('#vsort').find('.searched').removeClass('searched');
    		$(e.target).closest('.vItem').addClass('searched');
    	} else {
    		$(e.target).closest('.vItem').toggleClass('searched');
    	}
    	var params = searchParams();
		searchDB(params);
    });

    $(window).scroll(function() {
	   if($('#content').scrollTop() == $('#content').height()) {
	       alert("bottom!");
	   }
	});
	var playerControls = function() {
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
	};
	$('#player').on('mousemove',playerControls);

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
		$('#videoSearcher').val($('#songArtist').text());
		$('#vsort .searched').removeClass('searched');
		$('#vsort #vitemNewest').addClass('searched');
		$('#vfilter .searched').removeClass('searched');
		$('#vsearch .searched').removeClass('searched');
		$('#vsearch #vitemArtists').addClass('searched');
		var params = searchParams();
		searchDB(params);
	});
	$('#songPlaylist').click(function() {
		$('#player').removeClass('active');
		var $html = buildSongs(currentList);
		var time = transition();
        	videoEnter($html, time);
		currentlyPlaying($('#player').attr('data-vid'));
	});
});

function nav(e) {
	$('.selected').removeClass('selected');
	var $button = $(e.target).closest('.nav');
	$(e.target).closest('.nav').addClass('selected');
	var nav = $(e.target).closest('.nav').attr('id');
	var pos_x = $('.nav').css('')
	$('.nav').removeClass('active');
	$(e.target).closest('.nav').addClass('active');
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
				var time = transition();
        		pageEnter(res, time);
			});
			break;
		case 'myLists':
				$.get('/myLists', function(res) {
					var time = transition();
        			pageEnter(res, time);
					$.get('/userPlaylists', function(res) {
						playlists = res;
						$('.block').click(showList);
					});
				});
			break;
		case 'title':
			$.get('/blogs', function(res) {
				var time = transition();
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

function insertSong() {
		var vid = $("#url").val().split("v=")[1];
		if(vid.indexOf('&') > -1)
			vid = vid.split('&')[0];
		// var data = id + '&' + $('#inputName').val() + '&' + $('#inputArtist').val();
		// $.post("/storeSong/"+data, function() {
			
		// });
		$.ajax({
			url: "/storeSong",
	        type: "post",
	        dataType: "json",
	        data: JSON.stringify({vid: vid, name: $('#inputName').val(), artist: $('#inputArtist').val()}),
	        contentType: "application/json",
	        cache: false,
	        timeout: 5000,
	        success:function(res) {
	        	console.log('back');
				$('#songInput input').val('');
		    }
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
	var vid = $(e.target).closest('.block').attr('data-vid');

	$(e.target).attr('src', "http://img.youtube.com/vi/"+vid+"/maxresdefault.jpg");
}

function accountSignUp(e) {
	if($(e.target).hasClass('active')) {
			$('#accountSignUp').html('Create Account');
			console.log($('#newAccountUser').val());
			console.log($('#newAccountPassword').val());
			console.log($('#newAccountEmail').val());
			if($('#account #user').val() != '' && $('#account #password').val() != '' && $('#accout #email').val() != '') {
				$.ajax({
					url: "/signUp",
			        type: "post",
			        dataType: "json",
			        data: JSON.stringify({user: $('#account #user').val(), password: $('#account #password').val(), email: $('#account #email').val()}),
			        contentType: "application/json",
			        cache: false,
			        timeout: 5000,
			        success:function(res) {
					       	$.get('/myLists', function(res) {
							console.log(res);
							$('#content').html(res);
						});
				    },
				    error: function(res) {
				    	alert('User Already Exists.');
				       	$('.signUp').val('');
				    }
				});
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
	if($(e.target).hasClass('active')) {
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
		       	var time = transition();
        		pageEnter(res, time);
		    },
		    error: function(res) {
		    	console.log(res);
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

function logout() {
	console.log('test');
	$.get('/logout', function() {
		$.get('/myLists', function(res) {
			var time = transition();
        	pageEnter(res, time);
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

function loadMore() {
	var num = $('.block').not('.block.inactive').length;
	var n = 0,
		time = 0;
	$('.block.inactive:lt('+num+')').css('display','block');
	$('.block.inactive:lt('+num+')').each(function(event) {
		time = (n%5)*50 + Math.floor(n/5)*50;
		var $block = $(this);
		setTimeout(function() {
			$block.removeClass('inactive');
		},time);
		n++;
	});
	console.log('inside');
	setTimeout(function() {
		if($('.block.inactive').length == 0) {
			$('#loadMore').remove();
		}
		console.log('inside');
		buildCurrentList(0);
	}, time+200);
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