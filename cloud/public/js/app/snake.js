define(['utils/make_evented_constructor'], function(makeEventedConstructor) {
    
    return makeEventedConstructor({

    	init: function(color, startingCell, direction) {

    		this.direction = direction;
    		this.color = color;

    		// an array of cells.
    		this.body = [];

    		this.body[0] = startingCell;
    		startingCell.setState({
    			type: 'snake', 
    			color: color
    		});

    		console.log("this.body, from Snake.prototype.init: ");
    		console.dir(this.body);

    		console.log("this.color, from Snake.prototype.init: ");
    		console.log(this.color);

    		console.log("this.direction from Snake.prototype.init: ");
    		console.log(this.direction);

    		// Event handler
            var self = this;
    		this.on('receiveSnakeDirection', function(data) {
    			self.direction = data.direction;
    		});
    	},

    	addNewHead: function(newHead) {
    		this.body.unshift(newHead);
    		newHead.setState({
    			type: 'snake', color: color
    		});
    	},

    	removeOldTail: function() {
    		var oldTail = this.body.pop();
    		oldTail.setState(null);
    	},

    	evaluateMoveTo: function(newHead) {
    		if (newHead.isEmpty()) {
    			this._nextHead = newHead;
    		} 
    		else {
    			this.trigger('hasHitObstacle');
    		}
    	},

    	move: function() {
    		var currentHeadFaceIdx = this.body[0].location.faceIdx,
    			nextHeadFaceIdx = this._nextHead.location.faceIdx;

    		console.log("Moving a snake from " + this.body[0].location.x + ", " + 
    							this.body[0].location.x + " to " + this._nextHead.location.x + ", " + this._nextHead.location.y);

    		if (currentHeadFaceIdx !== nextHeadFaceIdx) {
    			this.trigger('leavingFace', {
    				from: currentHeadFaceIdx,
    				to: nextHeadFaceIdx
    			});
    		}

    		this.addBodySegment(this._nextHead);

    		if (!this.hasJustEaten()) {
    			this.removeOldTail();
    		}
    	},

    	hasJustEaten: function() {

    		// TODO (NOT URGENT): put in code for eating food here. Requires 
    		// action from the server to make sure that there is always one
    		// bit of food on every face, visible to both players.
    		// Right now, just make sure the snake doesn't get too long.

    		return this.body.length < 100;
    	}

    });
});




