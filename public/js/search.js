var listParams = [];

function searchDB(params) {
	$('#navbar').removeClass('home');
	$('#userListsNav').removeClass('home');
	$('#player').removeClass('home');
	$.ajax({
		url: "/videoSearch",
        type: "post",
        dataType: "json",
        data: JSON.stringify({sval: params[3], searchParams: params[0], filterParams: params[1], sortParams: params[2], offset: params[4][0], limit:params[4][1]}),
        contentType: "application/json",
        cache: false,
        timeout: 5000,
        success:function(res) {
        	var time = transition();
        	videoEnter(res.html, time, params[4][0]);
        }
    });
}

function loadMoreVideos(dir) {
	var page = parseInt($('#pageNumber').html());
	var params = searchParams();
	if(dir == true)
		var offset = page*75;
	else
		var offset = page*75-150;
	var limits = [offset,75];
	params.splice(-1,1);
	params.push(limits);
	searchDB(params);
}

function searchParams() {
	params = [];
	var searchParams = '';
	$('#vsearch').find('.searched').each(function() {
		searchParams += $(this).attr('data-search') + ',';
	});
	searchParams = searchParams.substring(0,searchParams.length-1);
	params.push(searchParams);
	var filterParams = '';
	$('#vfilter').find('.searched').each(function() {
		filterParams += $(this).attr('data-search') + ',';
	});
	filterParams = filterParams.substring(0,filterParams.length-1);
	params.push(filterParams);
	var sortParams = '';
	$('#vsort').find('.searched').each(function() {
		sortParams += $(this).attr('data-search') + ',';
	});
	sortParams = sortParams.substring(0,sortParams.length-1);
	params.push(sortParams);
	var sval = $('#videoSearcher').val();
	params.push(sval);
	var limits = [0,75];
	params.push(limits);
	return params;
}

function setParams(params) {
	$('#videoSearcherWrapper .searched').removeClass('searched');
	for(var i = 0; i < params.length-2; i++) {
		var p = params[i].split(',');
		for(var j = 0; j < p.length; j++) {
			$('.query').each(function() {
				if($(this).attr('data-search') == p[j]) 
					$(this).addClass('searched');
			});
		}
	}
	$('#videoSearcher').val(params[3]);
}

function buildSongs(m, name, lid) {
	var time = 0;
	var $html = $('<div id="videos" data-lid=""></div>');
	if(name) {
		$html.attr('data-lid', lid);
		//$html.append($('<div id="listBanner" data-lid="'+lid+'"><div id="backToLists" onclick="backToLists()"><span class="glyphicon glyphicon-menu-left"></span></div><div id="listName">'+name+'</div><div id="listEdit">EDIT</div></div>'));
		$html.append($('<div id="listBanner" data-lid="'+lid+'"><div id="backToLists" onclick="backToLists()"><span class="glyphicon glyphicon-menu-left"></span></div><input type="text" id="listNameInput" value="'+name+'"/></div>'));
	}
	for(var i = 0; i < m.length; i++) {
		var $block = $('<div id="s'+i+'" class="block inactive" data-id="'+i+'" data-vid="'+m[i][2]+'"></div>');
		$block.append($('<img src="http://img.youtube.com/vi/'+m[i][2]+'/0.jpg" class="list song"/>'));
		var $description = $('<div class="description"></div>');
		$description.append($('<span class="name">'+m[i][0]+'</span>'));
		$description.append($('<span class="artist">'+m[i][1]+'</span>'));
		$description.append($('<span class="glyphicon glyphicon-play"></span>'));
		if(name) {
			$description.append($('<div class="listDelete" onclick="deleteSong(event)">&#215</div>'));
			$block.addClass('edit');
		}
		$block.append($description);
		$block.appendTo($html);
	}
	return $html;
}

// function loadMoreAppend(res) {
// 	console.log($('#loadMore'));
// 	$('#loadMore').remove();
// 	var n = 0;
// 	var time = 0;
// 	$('#videos').append(res);
// 	$('.block').css('display','block');
// 	$('.block.inactive').each(function(event) {
// 		time = (n%5)*50 + Math.floor(n/5)*50;
// 		var $block = $(this);
// 		setTimeout(function() {
// 			$block.removeClass('inactive');
// 		},time);
// 		n++;
// 	});
// 	currentlyPlaying($('#player').attr('data-vid'));
// 	if($('.block').length%50 == 0) {
// 		$('#videos').append($('<div id="loadMore" onclick="loadMoreVideos()">L o a d M o r e</div>'));
// 	}
// }

// function searchDBappend(params) {
// 	$.ajax({
// 		url: "/videoSearch",
//         type: "post",
//         dataType: "json",
//         data: JSON.stringify({sval: params[3], searchParams: params[0], filterParams: params[1], sortParams: params[2], offset: params[4][0], limit:params[4][1]}),
//         contentType: "application/json",
//         cache: false,
//         timeout: 5000,
//         success:function(res) {
//         	loadMoreAppend(res.html);
//         }
//     });
// }