var express = require('express'),
	app = express.createServer(),
	request = require('request'),
   	httpProxy = require('http-proxy'),
   	proxy = new httpProxy.RoutingProxy(),
   	_public = './public',
	port = 3000;

	console.log("Server running on port: " + port);
	
	// server url165.225.130.235


var registrationKey = "8982bf5e-2c54-45c7-9bc1-e0672f119c2a";

var cloudManager = (function(){
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
		workingclouds[data.uid]["validated"] = true;
	});
	
	
	var removecloud = function(uid){
		console.log("Deleting cloud"+uid);
		delete workingclouds[uid]
	}
	var workingclouds = {};
	var addcloud = function(uid, cloud){
		if(!uid || !cloud){ return; }
		
		for(var key in workingclouds){
			if(workingclouds[key].url === cloud.url){
				return;
			}
		}
		workingclouds[uid] = cloud;
		trigger('newcloud', cloud);
	}
	var returnclouds = function(){
		return workingclouds;
	}

	setInterval(function(){
		for(var key in workingclouds){

			(function(key, cloud){
				if(!cloud) return;
				console.log('checking url : '+ "http://"+cloud.url+"/playerCount")
				request("http://"+cloud.url+"/playerCount", function(e, body){
					if(e){
						removecloud(cloud.uid) 
						console.log('A cloud has died '+cloud.uid + " "+ cloud.url)
						return;
					}
					try {
						var respObj = JSON.parse(body.body);
						workingclouds[key].playerCount = respObj.playerCount;
					} catch(e){
						console.log(e);
					}
					
				});
			}(key, workingclouds[key]));
		}
	}, 10000);

	var pickcloud = function(){
		var leastConnect = { playerCount: 1 };
		for(var key in workingclouds){
			if(workingclouds.hasOwnProperty(key)){
				if(typeof workingclouds[key].playerCount !== 'undefined' && workingclouds[key].playerCount <= leastConnect.playerCount){
					leastConnect = workingclouds[key];
				}
			}
		}
		if(!leastConnect.url){
			for(var key in workingclouds){
				leastConnect = workingclouds[key];
			}
		}
		return leastConnect;

	};
	return {
		on: on,
		trigger: trigger,
		addcloud: addcloud,
		returnclouds: returnclouds,
		removecloud: removecloud,
		pickcloud: pickcloud
	}	
}());
var errors = [];
cloudManager.on('newcloud', function(data){
	console.log('new cloud');
	console.log(data.url);
	try{
		request("http://"+data.url+"/confirmation/"+data.confirmation_key, function(e, body){
			
			if(e){ 
				console.log(e);
			
				errors.push('error hitting ' + data.url);
				errors.push(e);
				cloudManager.removecloud(data.uid) 
				return;
			}
			try {
				var respObj = JSON.parse(body.body);
				if(respObj.uid !== data.uid){  
					errors.push('diff data '+respObj.uid+' '+data.uid);
					cloudManager.removecloud(data.uid) 
				} else {
					console.log('server validated');

					cloudManager.trigger('validated_server', data);
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
app.get('/isup', function(req,res){
	res.send(true);
});
app.get('/currentclouds', function(req, res){
	res.send(cloudManager.returnclouds());
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
	var cloud = cloudManager.pickcloud();

	console.log(cloud)
	if(!cloud || !cloud.url){ res.send("no clouds to forward to"); return;}

	res.render('index.jade',{
		server: cloud.url
	});
});

var clouds  = [];
app.get('/register/:url/:key/:confirmationkey', function(req, res){
	var key = req.params.key,
		confirm_key = req.params.confirmationkey,
	    url  = req.params.url;
	if(!url || key !== registrationKey){ res.send({ uid: false }); return; }
	
	var uid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		return v.toString(16);
	});
	
	var possiblecloud = {
		uid: uid,
		ip: req.connection.remoteAddress,
		url: url,
		confirmation_key: confirm_key,
		validated: false
	};
	cloudManager.addcloud(uid, possiblecloud);	

	res.send({uid: uid});
	
});



app.listen(port);
	
