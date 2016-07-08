function transition() {
	if($('.block').length > 0) {
		var time = videoExit();
	} else {
		var time = pageExit();
	}
	return time;
}

function videoExit() {
	if($('.block').length > 50) {
		$('.block').animate({
			opacity: '0'
		},200);
		var time = 200;
	} else {
		var n = 0,
			time;
		console.log('block exit');
		$('.block').each(function(event) {
			time = (n%5)*50 + Math.floor(n/5)*50;
			var $block = $(this);
			setTimeout(function() {
				$block.addClass('leave');
			},time);
			n++;
		});
		time += 200;
	}
	return time;
}

function videoEnter(res, time, page, banner) {
	setTimeout(function() {
		console.log('empty');
		$('#content').empty();
		$('#content').scrollTop(0);
		var $html = $('<div id="videos" data-lid=""></div>');
		if(banner)
			$html.append('<div class="'+banner.class+'">'+banner.name+'</div>');
		$html.append(res);
		$('#content').append($html);
		var n = 0,
			t;
		$('.block').css('display','block');
		$('.block').each(function(event) {
			t = (n%5)*50 + Math.floor(n/5)*50;
			var $block = $(this);
			setTimeout(function() {
				$block.removeClass('inactive');
			},t);
			n++;
		});
		$('.playSong').on("mousedown", blockClick);
		currentlyPlaying($('#player').attr('data-vid'));
		page = parseInt(page/75)+1;
		$('#pageNumber').html(page);
		if($('.block').length%75 == 0 && $('.block').length>0) {
			$('#pageSelection').append($('<div id="nextPage" onclick="loadMoreVideos(true)" data-page="'+page+'"><span class="glyphicon glyphicon-menu-right"></span></div>'));
		}
		if(page > 1) {
			$('#pageSelection').append($('<div id="previousPage" onclick="loadMoreVideos(false)"><span class="glyphicon glyphicon-menu-left"></span></div>'));
		}
	},time);
}

function listEnter() {
	var n = 0, t;
	$('.block').css('display','block');
	$('.block').each(function(event) {
		t = (n%5)*50 + Math.floor(n/5)*50;
		var $block = $(this);
		setTimeout(function() {
			$block.removeClass('inactive');
		},t);
		n++;
	});
}

function pageExit() {
	$('#content > div').animate({
		opacity: '0',
		left: '-=50px'
	},200);
	return 200;
}

function pageEnter(res, time) {
	setTimeout(function() {
		$('#content').empty();
		$('#content').scrollTop(0);
		$('#content').append(res);
		if($('.list').length > 0) {
			console.log('test');
			listEnter();
		}
	},time);
}

// function animateBlockExit() {
// 	var n = 0;
// 	$('.block').not('.block.inactive').each(function(event) {
// 		time = (n%5)*50 + Math.floor(n/5)*50;
// 		var $block = $(this);
// 		setTimeout(function() {
// 			$block.addClass('leave');
// 			$block.css('opacity','0');
// 		},time);
// 		n++;
// 	});
// 	time += 200;
// 	return time;
// }

// function animateBlocksRow(bk, num) {
// 	if(bk.eq(num)) {
// 		bk.eq(num).animate({
// 			left: '-=50px',
// 			opacity: '0'
// 		},200, function() {
// 			animateBlocksRow(bk, num++);
// 		});
// 	} else {
// 		return;
// 	}
// }

// function animateBlockRow(bk) {
// 	var timeout = 0;
// 	// bk.eq(0).animate({
// 	// 	left: '-=50px',
// 	// 	opacity: '0'
// 	// },200);
// 	for(var i = 0; i < bk.length; i++) {
// 			bk.eq(i).animate({
// 				left: '-=50px',
// 				opacity: '0'
// 			},200, function() {
// 				bk.eq(i).remove();
// 			});
// 	}
// }

// function pageTransitions(res) {
// 	if($('#content > #videos').length > 0) {
// 		if($('.block').not('.block.inactive').length > 50) {
// 			$('.block').animate({
// 				opacity: '0'
// 			},200);
// 			var time = 200;
// 		} else {
// 			var time = animateBlockExit();
// 		}
// 		setTimeout(function() {
// 			$('#content').empty();
// 			$('#content').scrollTop(0);
// 			$('#content').append(res);
// 			currentlyPlaying($('#player').attr('data-vid'));
// 			$('.block').on("mousedown", blockClick);
// 			if($('#content > #videos').length > 0) {
// 				console.log('c');
// 				var n = 0,
// 					time;
// 				$('.block:lt(50)').css('display','block');
// 				$('.block:lt(50)').each(function(event) {
// 					time = (n%5)*50 + Math.floor(n/5)*50;
// 					var $block = $(this);
// 					setTimeout(function() {
// 						$block.removeClass('inactive');
// 					},time);
// 					n++;
// 				});
// 				setTimeout(function() {
// 					if($('.block.inactive').length > 0) {
// 						//$('#loadMore').remove();
// 						//$('#videos').append($('<div id="loadMore" onclick="loadMore()">L o a d M o r e</div>'));
// 					}
// 				},time+200);
// 			} else {
// 				console.log($('#content > div'));
// 				$('#content > div').animate({
// 					opacity: '1',
// 					left: '-=50px'
// 				},200);
// 			}
// 		}, time);
// 	} else {
// 		console.log('d');
// 		$('#content > div').animate({
// 			opacity: '0',
// 			left: '-=50px'
// 		}, 300, function() {
// 			$('#content').empty();
// 			$('#content').scrollTop(0);
// 			$('#content').append(res);
// 			currentlyPlaying($('#player').attr('data-vid'));
// 			$('.block').on("mousedown", blockClick);
// 			if($('#content').find('#videos').length > 0) {
// 				var n = 0;
// 				$('.block:lt(50)').css('display','block');
// 				$('.block:lt(50)').each(function(event) {
// 					var time = 0;
// 					time = (n%5)*50 + Math.floor(n/5)*50;
// 					var $block = $(this);
// 					setTimeout(function() {
// 						$block.removeClass('inactive');
// 					},time);
// 					n++;
// 				});
// 				console.log($('.block.inactive').length);
// 				setTimeout(function() {
// 					if($('.block.inactive').length > 0) {
// 						//$('#loadMore').remove();
// 						//$('#videos').append($('<div id="loadMore" onclick="loadMore()">L o a d M o r e</div>'));
// 					}
// 				},time+200);
// 			} else {
// 				console.log($('#content > div'));
// 				$('#content > div').animate({
// 					opacity: '1',
// 					left: '-=50px'
// 				},200);
// 			}
// 		});
// 	}
// }