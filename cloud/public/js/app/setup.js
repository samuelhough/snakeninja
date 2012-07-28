define([
    'jquery'
    //'/socket.io/socket.io',
], function(
    $
    //io,
) {
    console.log($);
    console.log(jQuery);
    var notouch = 0;

	var cookie = (function(){
		function getCookie(c_name)
		{
			var i,x,y,ARRcookies=document.cookie.split(";");
			for (i=0;i<ARRcookies.length;i++)
			{
				x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
				y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
				x=x.replace(/^\s+|\s+$/g,"");
				if (x==c_name)
				{
					return unescape(y);
				}
			}
			return null;
		}

		function setCookie(c_name,value,exdays)
		{
			var exdate=new Date();
			exdate.setDate(exdate.getDate() + exdays);
			var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
			document.cookie=c_name + "=" + c_value;
		}
		var touched = false;
		function resetCookie(){
			if(touched){ return; } else { touched = true; }
			cookie.set('notouch', 0);
		}
		return {
			get: getCookie,
			set: setCookie,
			reset: resetCookie
		}
	}());
	var noTouch = cookie.get('notouch');


	if(noTouch){
		noTouch = Number(noTouch);
		noTouch++;
		cookie.set('notouch', noTouch);

		if(noTouch === 2){
			cookie.set('notouch', 0);
			document.location = document.location + "waitingroom";

		}
	} else {
		cookie.set('notouch', 0);
	}
	
	console.log($);
	
	$(document).on('click', function(){
		cookie.reset();
	});

	var url = document.location.host;

	var socket = io.connect('http://'+url);
	
	
	
	socket.emit('really');
	
	function addMsg(msg){
		$('#chat').html(msg + "<br>"+ $('#chat').html() );
	}
	function refreshPage(){
		setTimeout(function(){
			document.location = document.location;
		}, 3000);
	}
	function dispResults(win){
		var div = $('<div></div>').appendTo('body').addClass('modal');
		if(win){
			$(div).addClass('win').html("Winner!");
		} else {
			$(div).addClass('fail').html("LOSE!!! :(");
		}
	}

	socket.on('userConnected', function (data) {
	    	addMsg("You connected to the game");
	});

	socket.on('setRoomId', function(newId){
		console.log(newId)
	});

//	socket.on('chat', function(chat){
//		$('#msg').html($('#msg').html() + "<br> "+ chat)
//	});
//	socket.emit('chat','hi');

	socket.on('refreshPage', function(){
		addMsg('Game over!');
		refreshPage()
	});
	socket.on('playerQuit', function(){
		GAME_ON = false;
		addMsg("The other user has left the game!");

		addMsg("Refreshing the page to join you into a new game");
		refreshPage();

	});

	socket.on('gameOver', function(win){
		GAME_ON = false;
		dispResults(win);
		if(win){
			addMsg("You have won!");


		} else {
			addMsg("You have lost :(");

		}

		addMsg("Refreshing the page to join you into a new game");
		refreshPage();

	});

	socket.on('clientMsg', function(data){
		console.log(data);
		addMsg(data);
	});
	
	return {
		socket: socket,
		addMsg: addMsg
	}
});

