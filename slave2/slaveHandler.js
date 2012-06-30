module.exports.init = function(app, gameManager){
	var errors = [];
	var request = require('request');
	var slaveConnect = true;
	var uid = null,
		serverIp = "snake.jit.su",
		myAddress = "snakeslave2.jit.su"
		key = "8982bf5e-2c54-45c7-9bc1-e0672f119c2a",
		authenticated = false;

	var registerSlave = function(){
		if(!slaveConnect ){ 
			console.log('slave connect disabled'); 
			return false;
		}
		request("http://"+serverIp+"/register/"+myAddress+"/"+key, function(e, body){
			if(e) { errors.push(e); console.log(e); return; }
			try {
				var obj = JSON.parse(body.body);
				uid = obj.uid;
				authenticated = true;
			} catch(e){
				authenticated = "failed";
				errors.push(e);
			}
		});
	}

	app.get('/authenticated', function(req, res){
		res.send(authenticated);
	});

	app.get('/errors', function(req, res){
		res.send(errors);
	});
	app.get('/reregister', function(req, res){
		registerSlave();
		res.send('reregistering...');
	});
	app.get('/status/:uid', function(req, res){
		if(req.params.uid !== uid) {
			res.send(false)
		} else {
			res.send({uid: uid});
		}
	});

	app.get('/confirmation',function(req, res){
		res.contentType('json');
		res.send({ uid: uid});
	});

	app.get('/playerCount', function(req, res){
		console.log('pcount is')
		res.send({playerCount: gameManager.currentPlayerCount() });
	});

	registerSlave();

}