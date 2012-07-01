var port = Math.round(Math.random() * 1000) + 8000,
	this_server_web_address = "localhost" + ":" + port,
	exchange_key = "8982bf5e-2c54-45c7-9bc1-e0672f119c2a",
	register_cloud_with_balancer = true,
	confirmation_guid = "defd467a-a2b4-4895-9078-37caf2072c94",
	load_balancer_ip = "localhost:3000";
	reping_server_time = 30000;

	
module.exports = (function(){
	var props = {
		load_balancer_ip: load_balancer_ip,
		this_server_web_address: this_server_web_address,
		exchange_key: exchange_key,
		register_cloud_with_balancer: register_cloud_with_balancer,
		confirmation_guid: confirmation_guid,
		port: port,
		reping_server_time: reping_server_time
	}
	var get = function(key){
		if(!props[key]){
			throw "Key doesn't exists in prop"
			return;
		}
		return props[key]
	}
	return {
		get: get
	}
}());