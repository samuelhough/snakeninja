var LINE_CAP = 'butt';
var LINE_JOIN = 'miter';
var INTERVAL_TIME = 100; // microseconds
var BLOCK_HEIGHT = 10;
var GRID_SIZE = 50;
var PLAYER_ONE_COLOR = "#39c63f";
var PLAYER_TWO_COLOR = "#c73e92";
var BACKGROUND_COLOR = "#fff";	
var GAME_ON = false;

// This is the map of which edges are next to which other edges, when you
// glue them all together. This is used by the cube.adjacentCell method.
// It is an arbitrary map and the CSS for the actual rendering will have to correspond to it.
// (The top-level indices are face numbers.)

var DIRECTION_TRANSFORM_MAP = {
	"0": { 
		east:  {face: 1, direction: "west"}, 
		north: {face: 2, direction: "south"}, 
		west:  {face: 3, direction: "east"}, 
		south: {face: 4, direction: "north"} 
	},
	"1": { 
		east:  {face: 5, direction: "east"}, 
		north: {face: 2, direction: "east"}, 
		west:  {face: 0, direction: "east"}, 
		south: {face: 4, direction: "east"} 
	},
	"2": { 
		east:  {face: 1, direction: "north"}, 
		north: {face: 5, direction: "south"}, 
		west:  {face: 3, direction: "north"}, 
		south: {face: 0, direction: "north"} 
	},
	"3": { 
		east:  {face: 0, direction: "west"}, 
		north: {face: 2, direction: "west"}, 
		west:  {face: 5, direction: "west"}, 
		south: {face: 4, direction: "west"} 
	},
	"4": { 
		east:  {face: 1, direction: "south"}, 
		north: {face: 0, direction: "south"}, 
		west:  {face: 3, direction: "south"}, 
		south: {face: 5, direction: "north"} 
	},
	"5": { 
		east:  {face: 1, direction: "east"}, 
		north: {face: 4, direction: "south"}, 
		west:  {face: 3, direction: "west"}, 
		south: {face: 2, direction: "north"} 
	}
};

var helpers = {
	oppositeDirection: function(dir) {
		if (dir === 'north') return 'south';
		if (dir === 'south') return 'north';
		if (dir === 'east') return 'west';
		if (dir === 'west') return 'east';
	}
}


var CellModel = function(faceIdx, x, y) { 
	
	// TODO: Make getter and setter for color.
	// Also, instead of _state being a string,
	// it should be a reference to a snake object,
	// which would then contain a color (or it should be null).
	
	this._state = null;
	this.color = color;
	
	// READ-ONLY location object
	this._location = {
		faceIdx: faceIdx,
		x: x,
		y: y
	}
};

CellModel.prototype = {
	getLocation: function() {
		return this._location;
	},
	getState: function() {
		return this._state;
	},
	setState: function(state) {
		if (state !== this._state) {
			this._state = state;
			this.trigger('change')
		}
	},
	isEmpty: function() {
		return this._state === null;
	}
}

asEvented.call(CellModel.prototype);


var SnakeModel = function(color, startingCell, direction, cube, isOtherPlayer) {
	
	// TODO: FIND SOME WAY NOT TO HAVE TO PASS THE CUBE OBJECT TO THIS 
	// CONSTRUCTOR. RIGHT NOW WE CAN'T THINK OF ANY OTHER WAY TO 
	// GET ACCESS TO THE ADJACENTCELL METHOD, WHICH REALLY NEEDS TO BE
	// A METHOD OF THE CUBE, NOT THE CELL. OTHERWISE HOW COULD IT GET REFERENCES
	// TO THE OTHER FACES?
	
	this.color = color;
	this.cube = cube;
	this.direction = direction;
	this.isOtherPlayer = isOtherPlayer;
	
	// an array of cells.
	this.body = [];
	
	this.body[0] = startingCell;
	startingCell.setState('snake');
	startingCell.color = color;
	console.log(this.body);
	
	// TODO: Need an event emitter in here for when the snake crosses over into another face.

}

SnakeModel.prototype = {
	
	var self = this,
		_nextHead;
	
	addNewHead: function(newHead) {
		this.body.unshift(newHead);
		newHead.setState('snake');
		newHead.color = this.color;
	},
	
	removeOldTail: function() {
		var oldTail = this.body.pop();
		oldTail.setState(null);
		oldTail.color = null;
	},
	
	evaluateMove: function() {
		
		var newHead = this.cube.adjacentCell(this.body[0], this.direction);
			
		if (newHead.isEmpty()) {
			_nextHead = newHead;
		} 
		else {
			this.trigger('hasHitObstacle');
		}
	}

	move: function() {
		var currentHeadFaceIdx = this.body[0].location.faceIdx,
			nextHeadFaceIdx = _nextHead.location.faceIdx;
			
		if (currentHeadFaceIdx !== nextHeadFaceIdx) {
			this.trigger('leavingFace', {
				from: currentHeadFaceIdx,
				to: nextHeadFaceIdx
			});
		}
		
		this.addBodySegment(_nextHead);
		
		if (!this.hasJustEaten()) {
			this.removeOldTail();
		}
	},
	
	hasJustEaten: function() {
		
		// TODO: put in code for eating food here. (Not urgent.) Requires 
		// action from the server to make sure that there is always one
		// bit of food on every face, visible to both players.
		// Right now, just make sure the snake doesn't get too long.
		
		return this.body.length < 100;
	}

}

asEvented.call(SnakeModel.prototype);


var SnakeView = function(snake) {
	
	snake.on('hasHitObstacle', function() {
		GAME_ON = false;
		socket.emit("PlayerDeath");
	});
	
	socket.on('receivePlayerDirection', function(data) {
		snake.direction = data.direction;
	});
	
	if (!snake.isOtherPlayer) {
		
		// Event handlers for this player:
		$('body').on('keydown', function(e) {
			
			console.log(e.which);
			if (!GAME_ON) return;
			var newDirection;
			
			if (e.which === 87) {
				newDirection = "north";
			}
			else if (e.which == 68) {
				newDirection = "east";
			}
			else if (e.which == 83) {
				newDirection = "south";
			}
			else if (e.which == 65) {
				newDirection = "west";
			}
			
			if (newDirection && 
						newDirection !== snake.direction && 
						newDirection !== helpers.oppositeDirection(snake.direction)) {
				
				snake.direction = newDirection;
				socket.emit('movePlayer', {
					direction: snake.direction
				});
			}
			
/*			// quit
			else if (e.which === 27) {
				clearInterval(interval);
			} */
		});
	}
}

SnakeView.prototype = {
}



var FaceModel = function(size, faceIdx) {
	this.size = size;
	
	var fillerArray = _.range(0, size);
	this.grid = _.map(fillerArray, function (x) {
		return _.map(fillerArray, function (y) {
			var newCell = new CellModel(faceIdx, x, y);
			newCell.on('change', $.proxy(this.changeHandler, this));
			return newCell;
		});
	}); 
}

FaceModel.prototype = {
	changeHandler: $.proxy(function(cell) {
		this.trigger('cellChange', cell);
	}, this),
	
}

asEvented.call(FaceModel.prototype);


var FaceView = function(face, el, position) {
	var size = face.size;
	
	// Position is a number from 0 to 5. It starts out corresponding
	// exactly to the faceView's model's index in the faces array of the CubeModel, 
	// but instead of being a permanent
	// ID for the face (which the faces indices are, in the CubeModel),
	// position is just where the face happens to be located at the moment,
	// in the UI. (The starting arrangement will be specified in the CSS stylesheet.)
	
	this.position = position;
	
	this.el = document.getElementById(el);
	this.el.width = size * BLOCK_HEIGHT;
	this.el.height = size * BLOCK_HEIGHT;
	
	var c = this.ctx = this.el.getContext('2d');
	
	// Styling
	c.lineCap = LINE_CAP;
	c.lineJoin = LINE_JOIN;
	c.lineWidth = 1;
	c.strokeStyle = c.fillStyle = BACKGROUND_COLOR;
	
	// Clear canvas
	c.fillRect( 0, 0, size * BLOCK_HEIGHT, size * BLOCK_HEIGHT);
	
	// Set event handler.
	this.on('cellChange', $.proxy(function(cell) {
		var location = cell.getLocation();
		var color = cell.color;
		if (color) {
			this.drawCell(location.x, location.y, color);
		} else {
			this.eraseCell(location.x, location.y);
		}
	}, this));
	
}

var FaceView.prototype = {
	drawCell: function(x, y, color) {
		var c = this.ctx;

		c.fillStyle = color;
		var left = x * BLOCK_HEIGHT + 1;
		var top = y * BLOCK_HEIGHT + 1;
		c.fillRect( left, top, BLOCK_HEIGHT, BLOCK_HEIGHT );
		c.strokeRect( left, top, BLOCK_HEIGHT, BLOCK_HEIGHT );			
	},
	
	eraseCell: function(x, y) {
		this.renderCell(x, y, BACKGROUND_COLOR);
	},
	
	rotate: function(axis) {
		
		// The CANVAS_ROTATION_MAP is not made yet. It will consist
		// of six different rotations, with property names 
		// 'x-left', 'x-right', 'y-left', 'y-right', 'z-left', and 'z-right',
		// for left-handed and right-handed spin. Each of these properties
		// will be containing both the number of the new position for the 
		// canvas, and the css transforms necessary to get it there.
		
		var rotationObj = CANVAS_ROTATION_MAP[axis];
		this.position = rotationObj.newPosition;
		$(this.el).css(rotationObj.cssTransforms);
	}
}

	
var CubeModel = function(size){
	
	this.size = size;
	this.snakes = [];
	
	this.faces = _.map(_.range(0, 6), function(index) {
		return new Face(size, index);
	});
	
};

CubeModel.prototype = {
	
	addSnake: function(snake) {
		this.snakes.push(snake);
		snake.on('leavingFace', function(transitObj.) {
			var from = transitObj.from;
			var to = transitObj.to;
			
			// TODO: Flesh this out. This needs to use the 'from' and 'to' face indices
			// to determine the axis of rotation (using yet another arbitrary map, probably)
			// and then it needs to call the 'rotate' method on all six of the faces, using
			// the axis identifier.
			
			// OH NO WAIT! THIS IS ACTUALLY A BIT TRICKIER THAN THAT. THE 'FROM' AND 'TO' INDICES,
			// AS CURRENTLY WRITTEN, ONLY REFER TO THE MODEL RELATIONSHIPS, NOT TO THE ACTUAL CURRENT
			// POSITION OF THE FACES AS SEEN BY THE USER. MUST DO SOMETHING ABOUT THAT. PERHAPS STORE DYNAMIC TRANSFORM 
			// MAPS SO THAT MODEL INDICES CAN ALWAYS BE USED TO FIND CURRENT UI POSITION.

		})
	},
	
	adjacentCell: function(cell, direction) {
		
		var size = this.size,
			location = cell.getLocation(),
			faceIdx = location.faceIdx,
			face = this.faces[faceIdx],
			x = location.x,
			y = location.y,
			
			newFace = face,
			new_x = x,
			new_y = y;
			
		// First do the simple calculation, which will be all that is
		// needed if the snake remains within the face.
			
		if (direction === "east") {
			new_x += 1;
		} else if (direction === "north") {
			new_y += 1;
		} else if (direction === "west") {
			new_x -= 1;
		} else if (direction === "south") {
			new_y -= 1;
		}
		
		// Only do the hard part if the new cell is off of this face.
		
		if (new_x < 0 || new_x >= size || new_y < 0 || new_y >= size) {
			
			var edge, newEdge, transform;
			
			if (new_x < 0) {
				edge = "west";
			} else if (new_x >= size) {
				edge = "east";
			} else if (new_y < 0) {
				edge = "south";
			} else if (new_y >= size) {
				edge = "north";
			}
			
			transform = DIRECTIONS_TRANSFORM_MAP[faceIdx][edge];
			newFace = transform.face;
			newEdge = transform.direction;
			
			// First, set the new coordinate that is at the edge of the new face.
			
			if (newEdge === "east") {
				new_x = size - 1;
			} else if (newEdge === "north") {
				new_y = 0;
			} else if (newEdge === "west") {
				new_x = 0;
			} else if (newEdge === "south") {
				new_y = size - 1;
			}
			
			// Now set the other coordinate.
			
			// The case of not tilted at all (east goes to west and vice versa, 
			// north goes to south and vice versa) 
			// was already automatically dealt with
			// when new_x was set to x and new_y was set to y.
			
			// Next, the case of tilted 180 degrees:
			
			if (edge === newEdge) {
				if (edge === "east" || edge === "west") {
					new_y = size - y - 1;
				} else {
					new_x = size - x - 1;
				}
			}
			
			
			// The eight special cases of when it's tilted 90 degrees in either direction:
			
			if (edge === "east" && newEdge === "north") {
				new_x = size - y - 1;
			} else if (edge === "east" && newEdge === "south") {
				new_x = y;
			} else if (edge === "north" && newEdge === "east") {
				new_y = size - x - 1;
			} else if (edge === "north" && newEdge === "west") {
				new_y = x;
			} else if (edge === "west" && newEdge === "north") {
				new_x = y;
			} else if (edge === "west" && newEdge === "south") {
				new_x = size - y - 1;
			} else if (edge === "south" && newEdge === "east") {
				new_y = x;
			} else if (edge === "south" && newEdge === "west") {
				new_y = size - x - 1;
			}
			
		}
		
		return newFace.grid[new_x][new_y];
	},
	
}

var CubeView = function(cube) {
	this.cube = cube;
	
}

CubeView.prototype = {
	step: function() {
		_.each(this.cube.snakes, function(snake) {
			snake.evaluateMove();
		});
		if (GAME_ON) {
			_.each(this.snakes, function(snake) {
				snake.move();
			});
		}
	},
	init: function() {
		setInterval(function() {
			this.step();
		}, INTERVAL_TIME);
	}
}






// THE REST OF THIS FROM HERE TO THE END IS PARTIALLY REWRITTEN TO TAKE ACCOUNT OF THE 
// NEW CONSTRUCTORS ABOVE. THAT JUST NEEDS TO BE FINISHED.

// THEN THE ROTATION MAP NEEDS TO BE WRITTEN, AND THE INITIAL CSS TRANSFORM AND TRANSITION ATTRIBUTES, AND THE
// SNAKE EVENT THAT CAUSES THE CUBE TO ROTATE. ALSO THE LISTENER FOR THAT EVENT, IN THE CUBE.

// THEN I THINK WE'RE DONE!







// Once we receive the player colors, everything else can happen.

var mySnake,
	otherSnake,
	canvas,
	cube = new CubeModel(GRID_SIZE, FIELDNUM),
	canvas = new Canvas('mainCanvas', field, GRID_SIZE);
	
socket.on('thisPlayerData', function(data){
	var color = data.color,
		location = data.location,
		cell = cube.faces[location.faceIdx].grid[location.x][location.y],
		direction = (location.y < 20) ? "south" : "north";
		
		console.log(location);
		
	mySnake = new Snake(color, cell, direction, cube);		
	cube.addSnake(mySnake);	
	
});

var otherPlayerCalled = false;

socket.on('otherPlayerJoin', function(data) {
	if(otherPlayerCalled){ 
		socket.emit('gameReady');
		return; 
	} else { 
		otherPlayerCalled = true;			
	}
	addMsg("Another player has joined the game");

	var color = data.color,
		location = data.location;

	otherSnake = new Snake(color, location, cube, true);		
	field.addSnake(otherSnake);
	canvas.drawCell(location, otherSnake.color);

	socket.emit('sendPlayerData', {
		location: location,
		color: color
	})
});

socket.on('gameStart', function(){
	addMsg("The game is ready to start.	 Starting in 5 seconds....");
	var timeTillStart = 5;

	var startMsg = setInterval(function(){
		if(timeTillStart === 0){  
			addMsg('Start!');
			GAME_ON = true;
			canvas.init();
			clearInterval(startMsg);
		}
		addMsg(timeTillStart+"...");
		timeTillStart -= 1;

	}, 1000);
});


// TODO: we are now receiving a 'receivePlayerDirection' object instead. Rewrite.

// Set the event listeners for the other snake. 
socket.on('receivePlayerPos', function(data) {
	console.log(data.faceIdx + " " + data.x + " " + data.y);
	otherSnake.addPoint(data);
	canvas.drawCell(data, otherSnake.color);
});





