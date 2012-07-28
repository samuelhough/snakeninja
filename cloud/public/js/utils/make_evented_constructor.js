define(['asevented'], function(asEvented) {
    
    return function(proto) {
        
		var expose = function(){
			this.init.apply(this, arguments);
		};

		// Gets overridden if the caller provides its own version (which it should).
		expose.prototype.init = function(){};

		$.extend(expose.prototype, proto);
		asEvented.call(expose.prototype);

		return expose;
	}
	
});