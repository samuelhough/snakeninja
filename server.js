var express = require('express'),
	app = express.createServer(),
	port = 8000,
	_public = '/public';
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + _public));




// ROUTES
app.get('/css/:css', function(req, res){
	var fileName = req.param.css
	res.sendfile(_public + "/css/"+fileName)
})
app.get('/js/:js', function(req, res){
	var fileName = req.param.js
	res.sendfile(_public + "/js/"+fileName)
})

app.get('/', function(req, res){
	res.render('index.jade',{
		title: 'Franz Enzenhofer'
	});
});

app.listen(port);
