var express = require('express'),
	app = express.createServer(),
	port = 8000,
	_public = '/public',
	gameManager = require('./gameManager.js');
	
var uid = null,
	serverIp = "funfuntime.jit.su",
	myAddress = "funfuntime2.jit.su"
	key = "8982bf5e-2c54-45c7-9bc1-e0672f119c2a",
	authenticated = false;


var request = require('request');

var routes = require('./routes.js').init(app, _public, gameManager);

app.set('views', __dirname + '/views');
app.use(express.static(__dirname + _public));



var io = require('socket.io').listen(app, { log: false });
io.sockets.on('connection', function (socket) {
   console.log("New User Connected");
   gameManager.trigger('newConnection', socket);
});





console.log('server running')
app.listen(port);
