var express = require('express'),
	app = express.createServer(),
	port = 8000,
	_public = '/public',
	gameManager = require('./gameManager.js');


app.set('views', __dirname + '/views');
app.use(express.static(__dirname + _public));



var io = require('socket.io').listen(app, { log: false });

io.sockets.on('connection', function (socket) {
   gameManager.trigger('newConnection', socket);
});


/*
var chat = io
  .of('/chat')
  .on('connection', function (socket) {
    socket.emit('a message', {
        that: 'only'
      , '/chat': 'will get'
    });
    chat.emit('a message', {
        everyone: 'in'
      , '/chat': 'will get'
    });
  });


*/







// ROUTES
app.get('/css/:css', function(req, res){
	try {
		var fileName = req.param.css
		res.sendfile(_public + "/css/"+fileName)
	}	catch(e){
		console.log(e)
	}
})
app.get('/js/:js', function(req, res){
	var fileName = req.param.js
	res.sendfile(_public + "/js/"+fileName)
})
app.get('/js/libs/:js', function(req, res){
	var fileName = req.param.js
	res.sendfile(_public + "/js/libs/"+fileName)
})

app.get('/', function(req, res){
	res.render('index.jade',{
		title: 'Franz Enzenhofer'
	});
});

app.get('/games', function(req, res){
	res.send(gameManager.returnGames())
})


app.get('/error', function(req, res){
	res.send(errors)

})

console.log('server running')
app.listen(port);
