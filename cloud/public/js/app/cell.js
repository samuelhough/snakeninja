define(['utils/make_evented_constructor'], function(makeEventedConstructor) {
    
    return makeEventedConstructor({

    	init: function(location){

    		// _state contains an object with two properties:
    		// type ('snake' or 'food'), and color.
    		// When the whole object is null, it's empty.

    		this._state = null;

    		// READ-ONLY location object
    		this._location = location;
    	},

    	getLocation: function() {
    		return this._location;
    	},

    	getState: function() {
    		return this._state;
    	},

    	setState: function(state) {
    		if (!(_.isEqual(state, this._state))) {
    			this._state = state;
    			this.trigger('change', this)
    		}
    	},

    	isEmpty: function() {
    		return this._state === null;
    	}

    });
});