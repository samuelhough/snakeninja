
var url = document.location.host;

var socket = io.connect('http://'+url);

socket.on('userConnected', function (data) {
  $('#msg').html($('#msg').html() + data);  	
});

socket.on('setRoomId', function(newId){
	console.log(newId)
});

socket.on('chat', function(chat){
	$('#msg').html($('#msg').html() + "<br> "+ chat)
});
socket.emit('chat','hi');

socket.on('refreshPage', function(){
	document.location = document.location;
});

