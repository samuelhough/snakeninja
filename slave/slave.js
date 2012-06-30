var express = require('express'),
	app = express.createServer(),
	request = require('request');
	
var uid = null,
	serverIp = "funfuntime.jit.su",
	myAddress = "funfuntime2.jit.su"
	key = "8982bf5e-2c54-45c7-9bc1-e0672f119c2a",
	authenticated = false;

var errors = [];


function register(){
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

app.get('/', function(req, res){
	res.send(authenticated);
});

app.get('/errors', function(req, res){
	res.send(errors);
});
app.get('/reregister', function(req, res){
	register();
	res.send('reregistering...');
});
app.get('/status/:uid', function(req, res){
	if(req.params.uid !== uid) {
		res.send(false)
	} else {
		res.send({uid: uid});
	}
});

app.get('/playerCount', function(req, res){
	res.send({playerCount: 0});
})


app.get('/confirmation',function(req, res){
	res.contentType('json');
	res.send({ uid: uid});
});
app.listen(80);
	
