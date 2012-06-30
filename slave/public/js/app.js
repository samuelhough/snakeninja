
var url;

if(document.location.host.indexOf('localhost')!== -1){
	url = "localhost:8000";
} else {
	url = document.location.host;
}
var socket = io.connect('http://'+url);

socket.on('userConnected', function (data) {
  $('#msg').html($('#msg').html() + data);  	
});

socket.on('setRoomId', function(newId){
	console.log(newId)
	roomId.set(newId);
});

socket.on('chat', function(chat){
	$('#msg').html($('#msg').html() + "<br> "+ chat)
});
socket.emit('chat','hi');

socket.on('refreshPage', function(){
	document.location = document.location;
});
