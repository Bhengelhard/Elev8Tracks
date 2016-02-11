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

function removeBlock(e) {
	e.stopPropagation();
	e.preventDefault();
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
