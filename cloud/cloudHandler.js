module.exports.init = function(app, gameManager){
	var errors = [];
	var request = require('request');
	
	var uid = null,
		config = require('./config.js'),
		serverIp = config.get("load_balancer_ip"),
		myAddress = config.get("this_server_web_address"),
		key = config.get("exchange_key"),
		register_cloud_with_balancer = config.get("register_cloud_with_balancer"),
		confirmation_guid = config.get("confirmation_guid"),
		reping_server_time = config.get("reping_server_time"),
		authenticated = false;

	function isBalancerUp(){
		request("http://"+serverIp+"/isup", function(e, body){
			if(e){ 
				console.log("Balancer appears to be down");
				registercloud();
			} else {
				console.log('Balancer is alive');
			}
		});
	}
	var registercloud = function(){
		if(!register_cloud_with_balancer){ 
			console.log('cloud connect disabled'); 
			return false;
		}
		console.log("Registering cloud with " + serverIp);
		request("http://"+serverIp+"/register/"+myAddress+"/"+key+"/"+confirmation_guid, function(e, body){
			console.log("Registration nearing completion");
			if(e) { 
				console.log("Error registering");
				console.log("Is server down?");
				setTimeout(function(){
					registercloud();
				}, reping_server_time);
				return; 
			}
			try {
				var obj = JSON.parse(body.body);
				uid = obj.uid;
				authenticated = true;
				console.log("Server has registered with Balancer. Awaiting confirmation");
				setInterval(function(){
					isBalancerUp();
				}, reping_server_time);
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
		registercloud();
		res.send('reregistering...');
	});
	app.get('/status/:uid', function(req, res){
		if(req.params.uid !== uid) {
			res.send(false)
		} else {
			res.send({uid: uid});
		}
	});

	app.get('/confirmation/:confirmkey',function(req, res){
		if(req.params.confirmkey !== "defd467a-a2b4-4895-9078-37caf2072c94"){
			console.log("Bad confirm key passed");
			res.send("Invalid confirm key");
			return;
		}
		console.log("Cloud is confirmed");
		res.contentType('json');
		res.send({ uid: uid});
	});

	app.get('/playerCount', function(req, res){
		//res.send('<!DOCTYPE html><html lang="en" class="no-js"><head>');
		res.send({playerCount: gameManager.currentPlayerCount() });
	});

	registercloud();

}