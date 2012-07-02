
module.exports.init = function(app, _public, gameManager){
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
		res.send({
			games: gameManager.returnGames(),
			gamesPlayed: gameManager.returnGamesPlayed()
		})
	})
	
	app.get('/waitingroom', function(req, res){ 
		res.send("You've been taken out of the game due to inactivity.  Go back to snake.jit.su/ to play some more!");
	});


	app.get('/error', function(req, res){
		res.send(errors)

	})
	
	

	var cloudLabor = require('./cloudHandler.js').init(app, gameManager)
}
