var express = require('express'),
	app = express.createServer(),
	request = require('request'),
   	httpProxy = require('http-proxy'),
   	proxy = new httpProxy.RoutingProxy(),
   	_public = './public';
	
	// server url165.225.130.235


var registrationKey = "8982bf5e-2c54-45c7-9bc1-e0672f119c2a";

var slaveManager = (function(){
	var events = [];
	var on = function(type, fn){
		if(typeof type !== 'string' || typeof fn !== 'function'){ return; }
		
		if(!events[type]){ 
			events[type] = [fn];
		}
		else {
			events[type].push(fn);
		}
	};
	var trigger = function(eventName, data){
		if(!events[eventName]){ events[eventName] = [] }
		for(var cur = 0; cur < events[eventName].length; cur ++){
			try{
				events[eventName][cur](data)
			} catch(e){
				console.log(e);
			}
		}
	};
	
	on('validated_server', function(data){
		workingSlaves[data.uid]["validated"] = true;
	});
	
	
	var removeSlave = function(uid){
		console.log("Deleting slave"+uid);
		delete workingSlaves[uid]
	}
	var workingSlaves = {};
	var addSlave = function(uid, slave){
		if(!uid || !slave){ return; }
		
		for(var key in workingSlaves){
			if(workingSlaves[key].url === slave.url){
				return;
			}
		}
		workingSlaves[uid] = slave;
		trigger('newSlave', slave);
	}
	var returnSlaves = function(){
		return workingSlaves;
	}

	setInterval(function(){
		for(var key in workingSlaves){

			(function(key, slave){
				if(!slave) return;
				console.log('checking url : '+ "http://"+slave.url+"/playerCount")
				request("http://"+slave.url+"/playerCount", function(e, body){
					if(e){
						removeSlave(slave.uid) 
						console.log('A slave has died '+slave.uid + " "+ slave.url)
						return;
					}
					try {
						var respObj = JSON.parse(body.body);
						workingSlaves[key].playerCount = respObj.playerCount;
					} catch(e){
						console.log(e);
					}
					
				});
			}(key, workingSlaves[key]));
		}
	}, 10000);

	var pickSlave = function(){
		var leastConnect = { playerCount: 1 };
		for(var key in workingSlaves){
			if(workingSlaves.hasOwnProperty(key)){
				if(typeof workingSlaves[key].playerCount !== 'undefined' && workingSlaves[key].playerCount <= leastConnect.playerCount){
					leastConnect = workingSlaves[key];
				}
			}
		}
		if(!leastConnect.url){
			for(var key in workingSlaves){
				leastConnect = workingSlaves[key];
			}
		}
		return leastConnect;

	};
	return {
		on: on,
		trigger: trigger,
		addSlave: addSlave,
		returnSlaves: returnSlaves,
		removeSlave: removeSlave,
		pickSlave: pickSlave
	}	
}());
var errors = [];
slaveManager.on('newSlave', function(data){
	console.log('new slave');
	console.log(data.url);
	try{
		request("http://"+data.url+"/confirmation", function(e, body){
			console.log(arguments);
			if(e){ 
				console.log(e);
			
				errors.push('error hitting ' + data.url);
				errors.push(e);
				slaveManager.removeSlave(data.uid) 
				return;
			}
			try {
				var respObj = JSON.parse(body.body);
				if(respObj.uid !== data.uid){  
					errors.push('diff data '+respObj.uid+' '+data.uid);
					slaveManager.removeSlave(data.uid) 
				} else {
					console.log('server validated');

					slaveManager.trigger('validated_server', data);
				}
			} catch(e){
				console.log(e);
			}
			
		});
	} catch(e){
		console.log(e);
	} 
});

app.get('/errors', function(req, res){
	res.send(errors.length);
});
var obj = [{a:1}, {b:2}]
app.get('/currentslaves', function(req, res){

	res.send(slaveManager.returnSlaves());
});

app.get('/js/:jsf', function(req, res){
	var fileName = req.params.jsf;
	var path = _public + "/js/"+fileName;
	console.log(path)
	res.sendfile(path)
})
app.get('/js/libs/:js', function(req, res){
	var fileName = req.params.js
	res.sendfile(_public + "/js/libs/"+fileName)
})



app.get('/', function(req, res){
	var slave = slaveManager.pickSlave();

	console.log(slave)
	if(!slave || !slave.url){ res.send("no slaves to forward to"); return;}

	res.render('index.jade',{
		server: slave.url
	});
});

var slaves  = [];
app.get('/register/:url/:key', function(req, res){
	var key = req.params.key;
	var url  = req.params.url;
	if(!url || key !== registrationKey){ res.send({ uid: false }); return; }
	
	var uid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		return v.toString(16);
	});
	
	var possibleSlave = {
		uid: uid,
		ip: req.connection.remoteAddress,
		url: url,
		validated: false
	};
	slaveManager.addSlave(uid, possibleSlave);	

	res.send({uid: uid});
	
});



app.listen(3000);
	
