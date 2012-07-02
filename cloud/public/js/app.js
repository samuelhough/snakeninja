
var url = document.location.host;

var socket = io.connect('http://'+url);
function addMsg(msg){
	$('#chat').html(msg + "<br>"+ $('#chat').html() );
}

socket.on('userConnected', function (data) {
    	addMsg("You connected to the game");
});

socket.on('setRoomId', function(newId){
	console.log(newId)
});

socket.on('chat', function(chat){
	$('#msg').html($('#msg').html() + "<br> "+ chat)
});
socket.emit('chat','hi');

socket.on('refreshPage', function(){
	alert('Game over!');
	document.location = document.location;
});
socket.on('playerQuit', function(){
	addMsg("The other user has left the game");
	addMsg("Refreshing the page to join you into a new game");
	setTimeout(function(){
		document.location = document.location;
	}, 3000);
});
socket.on('clientMsg', function(data){
	console.log(data);
	addMsg(data);
});