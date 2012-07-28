var express = require('express'),
	app = express.createServer(),
	config = require('./config.js'),
	port = 3000,
	//port = config.get('port'),
	_public = '/public',
	gameManager = require('./gameManager.js'),
	fs = require('fs');
	
var request = require('request');

var routes = require('./routes.js').init(app, _public, gameManager);

app.set('views', __dirname + '/views');
app.use(express.static(__dirname + _public));



var io = require('socket.io').listen(app, { log: false });
io.sockets.on('connection', function (socket) {
   console.log("New User Connected");
   gameManager.trigger('newConnection', socket);
});





function startApp(){
	try{
		app.listen(port);
		console.log("Server running on port "+port);
	} catch(e){
		port++;
		startApp();
	}
}
startApp();
