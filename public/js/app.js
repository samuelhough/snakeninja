var socket = io.connect('http://localhost:8000');

socket.on('userConnected', function (data) {
  socket.emit('userConnected', {
  		roomId: roomId.get()
  });
  $('#msg').html($('#msg').html() + data)  	
});


socket.on('setRoomId', function(newId){
	console.log(newId)
	roomId.set(newId);
});

socket.on('chat', function(chat){
	$('#msg').html($('#msg').html() + "<br> "+ chat)
});
socket.emit('chat','hi');