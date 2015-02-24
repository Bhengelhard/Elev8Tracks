var playlists = {};
var vheight = 315;
var ratio = 0.5625;
var players = {};
var currentPlay;
var currentTime;

$(document).ready(function() {

	spotify();

	$.get('/playlists', function(res) {
		renderLists(res);
	});

	$('#videoList').click(hideList);
	$('#theaterPause').click(theaterHide);

	$.getScript("https://www.youtube.com/iframe_api", function() {
 		console.log('success');
 	});
 	$(document).on('mouseover','#videoList',function() {
		$('#songList #songSelector').css('height','0px');
	});

});

function renderLists(lists) {
	playlists = lists;
	for(var i = 0; i < lists.length; i++) {
		var id = lists[i].thumbnail;
		var thumb = $('<img src="http://img.youtube.com/vi/'+id+'/hqdefault.jpg" class="list" data-id="'+lists[i].id+'"/>');
		//var list = $('<div data-id="'+lists[i].id+'" class="list"></div>');
		$("#playlists").append(thumb);
	}
	$('#playlists .list').click(showList);
}

// function showList() {
// 	$('#blur').addClass('active');
// 	$('#overlay').addClass('active');
// 	current = parseInt($(this).attr('data-id'))-1;
// 	// var videos = playlists[id].videoIDs.split(',');
// 	// var vNames = playlists[id].vNames.split(',');
// 	// var artists = playlists[id].artists.split(',');
// 	// var title = $('<span>'+playlists[id].name+'</span>');
// 	// var play = $('<span class="glyphicon glyphicon-play-circle"></span>');
// 	// $('#listTitle').append(play);
// 	// $('#listTitle').append(title);
// 	// var tag = document.createElement('script');
//  //    tag.src = "https://www.youtube.com/iframe_api";
//  //    var firstScriptTag = document.getElementsByTagName('script')[0];
//  //    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
//  }

 function showList() {
 	$('#blur').addClass('active');
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
		//var can = $('<div id="can'+i+'"></div>');
		//$('#videoList').append(can);
		//$('#videoList').append(can);
		var thumbCan = $('<div id="can'+i+'" data-id="'+videos[i]+'"><div id="player'+i+'"></div></div>')
		var thumbnail = $('<div id="pic'+i+'" data-id="'+videos[i]+'"><img src="http://img.youtube.com/vi/'+videos[i]+'/maxresdefault.jpg"/></div>');
		thumbCan.append(thumbnail);
		// test.src = '"http://img.youtube.com/vi/'+videos[i]+'/maxresdefault.jpg"';
		var nameCan = $('<div class="song" data-id="'+i+'" id="can'+i+'name"><span>'+vNames[i]+'</span><span>'+artists[i]+'</span></div>');
		// //embed = $('<iframe id="can'+i+'" width="560" height="315" src="https://www.youtube.com/embed/'+videos[i]+'?controls=1&showinfo=0&modestbranding=1" frameborder="0" allowfullscreen></iframe>');
  //       var id = 'can' + String(i);
  //       var player = new YT.Player(id, {
  //         height: '315',
  //         width: '560',
  //         videoId: videos[i],
  //         playerVars: i,
  //         events: {
  //         	'onReady': onPlayerReady
  //         }
  //        });
		$('#songList #buffer').before(nameCan);
		$('#videoList').append(thumbCan);
		// if(thumbnail.width()>0) {
		// 	//thumbnail = $('<img id="can'+i+'" src="http://img.youtube.com/vi/'+videos[i]+'/hqdefault.jpg"/>');
		// 	thumbnail.addClass('video');
		// 	console.log('made it!!');
		// }
		//thumbnail.addClass('video');
	}
	$('#videoList').append($('#bottombuffer'));
	$('#songList').addClass('active');
	$('#songList .song').mouseover(moveSelector);
	$('#songList .song').click(showTheater);
	// $('#listTitle span').click(function() {
	// 	console.log(document.getElementById('can0'));
	// 	document.getElementById('can0').playVideo();
	// });
	$('#overlay').mouseover(function() {
		$('#songList #songSelector').css('height','0px');
	});
	setTimeout(function() {
		$('#videoList').addClass('active');
	}, 250);
}
// function onPlayerReady(e) {
// 	var nameid = '#' + String($(e.target)[0].d.id) +'name';
// 	var vid = '#' + String($(e.target)[0].d.id);
// 	$(nameid).click(function() {
// 		e.target.playVideo();
// 		vtarget = e.target;
// 		videoTheater(vid);
// 	});
// }

function testing(x) {
	console.log('ayaya');
}

function onYouTubeIframeAPIReady() {
	console.log('youtube API sucks');
}

function hideList() {
	$('#blur').removeClass('active');
	$('#overlay').removeClass('active');
	$('#videoList div[id^="can"]').remove();
	$('#videoList').removeClass('active');
	$('#songList .song').remove();
	$('#songList').removeClass('active');
	$('#songList #songSelector').css('height','0px');
	$('#listTitle').empty();
	$('#videoList #players').empty();
}

function moveSelector(e) {
	var songblock = $(this).closest('.song');
	var vid = '#' + String($(this).attr('id').split('name')[0]);
	var height = songblock.css('height');
	var pos_y = songblock.position().top + $('#songList').scrollTop();
	$('#songList #songSelector').css('top',pos_y).css('height',height);
	var scroll = '+=' + String($(vid).position().top - ($(vid).height()/2)) + 'px';
	$('#videoList').stop(true, false).animate({
		scrollTop: scroll
	}, 300);
}

function videoTheater(vid) {
	var width = $(window).width()*.9;
	var height = width*ratio;
	var scroll = '+=' + String($(vid).position().top)+'px';
	console.log(scroll);
	console.log($('#videoList').scrollTop() );
    $(vid).addClass('play');
  	$('#videoList').addClass('play');
  	$('#overlay').addClass('play');
  	$('#theaterPause').addClass('play');
  	$('#listTitle').addClass('play');
  	$('#songList').addClass('play');
  	$('#videoList').animate({
  		scrollTop: scroll
  	},100);
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

function showTheater(e) {
	var vid = '#' + String($(e.target).attr('id').split('name')[0]);
	var yid = $(vid).attr('data-id');
	var playid = String($(e.target).attr('data-id'));
	var pos_y = $(vid).offset().top;
	var pos_x = $(vid).offset().left;
	$('#listTitle').addClass('play');
  	$('#songList').addClass('play');
  	if($('#videoList #players #player'+playid).length > 0) {
  		$('#videoList #players #player'+playid).addClass('vplay').css('top','0px').css('left','0px');
  		console.log(players['player'+playid]);
  		players['player'+playid].playVideo();
  	} else {
  	var cover = $('<div class="cover" data-id="'+playid+'"></div>');
	cover.css('position','absolute').css('top',pos_y).css('left',pos_x).css('width',$(vid).width()).css('height',$(vid).height());
	$('body').append(cover);
	cover.animate({
		top: '0px',
		left: '0px',
		width: '100%',
		height: '100%'
	},200, function() {
		//var player = $('<div class="vplay" id="player'+$(this).attr('data-id').split('can')[1]+'"></div>');
		//var playid = 'player'+ $(this).attr('data-id').split('can')[1];
		console.log($(this).attr('data-id'));
		var player = $('<div id="player'+$(this).attr('data-id')+'"></div>');
		var playerid = 'player'+$(this).attr('data-id');
		$('#videoList #players').append(player);
		player.addClass('vplay');
		//$('body').append(player);
		console.log($(this).attr('data-id').split('can')[1]);
		new YT.Player(playerid, {
	        videoId: yid,
	        events: {
	      	'onReady': onPlayerReady,
	      	'onStateChange': onPlayerStateChange
	      }
    	});
	});
	}
	// $('#listTitle').addClass('play');
 //  	$('#songList').addClass('play');
}

function onPlayerReady(e) {
	//$(e.target).addClass('play');
	// $('body>iframe').animate({
	// 	top: '0px',
	// 	left: '0px',
	// 	width: '100%',
	// 	height: '100%'
	// },200, function() {
	// 	e.target.playVideo();
	// });
	console.log('hello?');
	if($(e.target)[0].d.className =='vplay') {
		e.target.playVideo();
	} else {
		e.target.loadVideoById(currentPlay,currentTime,"large").pauseVideo();
	}
}

function onPlayerStateChange(e) {
	console.log('what??');
	if (e.target.getPlayerState() == 2) {
		if(e.target.getDuration() == e.target.getCurrentTime()) {
			var vid = $('.vplay').attr('id').split('player')[1];
			vid = String(parseInt(vid)+1);
			if($('#can' + vid).length > 0) {
				$('.cover').removeClass('play');

					var nextid = String($('#can'+vid).attr('data-id'));
					var playid = 'player'+vid;
					e.target.loadVideoById(nextid, 0, "large");
					if($('#'+playid).length > 0) {
						$('#'+playid).remove();
						players[playid] = e.target;
						$('#can'+vid+' .videoOverlay').removeClass('videoOverlay');
					}
					$('.vplay').attr('id', 'player'+vid);
					// $('.vplay').remove();
					// $('#can'+String(parseInt(vid-1))).append('<div id="player'+String(parseInt(vid-1))+'"></div>');
					// $('#pic'+String(parseInt(vid-1))).show();
					// $('#'+playid).addClass('vplay');
					// if($('#can'+vid).find('iframe').length > 0) {
					// 	players['#can'+vid].seekTo(0,1).playVideo();
					// } else {
					// 	players['#can'+vid] = new YT.Player(playid, {
					//         videoId: nextid,
					//         events: {
					//       	'onReady': onPlayerReady,
					//       	'onStateChange': onPlayerStateChange
				 //    	}
					// });
					//}
					//console.log($('#can'+vid).attr('data-id'));
					//$('#can'+vid).append($('.vplay'));
					//e.target.loadVideoById(nextid, 0, "large");

			} else {
				playerPause(e);
			}
		} else {
			playerPause(e);
		}

    } else if (e.target.getPlayerState() == 1) {
    	$('.cover').addClass('play');
    }
}

function playerPause(e) {
		$('.cover').addClass('play');
		console.log('fuck youtuuube!!!');
		var vid = '#can' + String($(e.target)[0].d.id.split('player')[1]);
		players[$(e.target)[0].d.id] = e.target;
		currentPlay = $(vid).attr('data-id');
		var player = '#' + String($(e.target)[0].d.id);
		currentTime = e.target.getCurrentTime();
		var pos_y = $(vid).offset().top + $('#videoList').scrollTop();
		$(player).removeClass('vplay').css('top',pos_y);
		//$(vid).append($(player));
		var pos_x = $(vid).offset().left;
		$('#listTitle').removeClass('play');
	  	$('#songList').removeClass('play');
	  	var pic = '#pic' + String($(e.target)[0].d.id.split('player')[1]);
	  	$(pic).addClass('videoOverlay');

}

// function showList() {
// 	$('#blur').addClass('active');
// 	$('#overlay').addClass('active');
// 	var id = parseInt($(this).attr('data-id'))-1;
// 	var videos = playlists[id].videoIDs.split(',');
// 	var vNames = playlists[id].vNames.split(',');
// 	var artists = playlists[id].artists.split(',');
// 	var title = $('<span>'+playlists[id].name+'</span>');
// 	var play = $('<span class="glyphicon glyphicon-play-circle"></span>')
// 	$('#listTitle').append(play);
// 	$('#listTitle').append(title);
// 	for(var i = 0; i < videos.length; i++) {
// 		// var can = $('<div id="can'+i+'"></div>');
// 		// $('#videoList').append(can);
// 		var nameCan = $('<div class="song" data-id="'+i+'"><span>'+vNames[i]+'</span><span>'+artists[i]+'</span></div>');
// 		//thumbnail = $('<img src="http://img.youtube.com/vi/'+videos[i]+'/maxresdefault.jpg" />');
// 		embed = $('<iframe width="560" height="315" src="https://www.youtube.com/embed/'+videos[i]+'?controls=1&showinfo=0&modestbranding=1" frameborder="0" allowfullscreen></iframe>');
// 		$('#videoList #bottombuffer').before(embed);
// 		$('#songList #buffer').before(nameCan);
// 		//$('#videoList').append(embed);
// 	}
// 	$('#songList').addClass('active');
// 	$('#songList .song').mouseover(moveSelector);
// 	$('#overlay').mouseover(function() {
// 		$('#songList #songSelector').css('height','0px');
// 	});
// 	setTimeout(function() {
// 		$('#videoList').addClass('active');
// 	}, 250);
// }