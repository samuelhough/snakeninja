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


var CellModel = function(faceIdx, x, y) { 
	
	this.state = null;
	
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
	}
}

asEvented.call(CellModel.prototype);


var SnakeModel = function(color, startingCell, direction, cube, otherPlayer) {
	
	this.color = color;
	this.cube = cube;
	this.direction = direction;
	this.otherPlayer = otherPlayer;
	
	// an array of cells.
	this.body = [];
	
	this.body[0] = startingCell;
	console.log(this.body);

}

SnakeModel.prototype = {
	
	var self = this,
		_nextHeadCell;
	
	addNewHead: function(cell) {
		this.body.unshift(cell);
		cell.state = 'snake';
	},
	
	removeOldTail: function() {
		var oldTail = this.body.pop();
		oldTail = null;
	},
	
	evaluateMove: function() {
		
		var newHead = this.cube.adjacentCell(this.body[0], this.direction);
			
		if (cube.isEmpty(newHead)) {
			_nextHeadCell = newHead;
		} 
		else {
			this.trigger('hasHitObstacle');
		}
	}

	move: function() {
		this.addBodySegment(_nextHeadCell);
		
		if (!this.hasJustEaten()) {
			this.removeOldTail();
		}
	},
	
	hasJustEaten: function() {
		// TODO: put in code for eating food here. (Requires continual 
		// food generation from the server.) Right now, just make sure 
		// the snake doesn't get too long.
		
		return this.body.length < 100;
	}

}

asEvented.call(SnakeModel.prototype);


var SnakeView = function(snake) {
	
	snake.on('hasHitObstacle', function() {
		GAME_ON = false;
		socket.emit("PlayerDeath");
	});
	
	if (!snake.otherPlayer) {
		// Event handlers:
		$('body').on('keydown', $.proxy(function(e) {
			console.log(e.which);
			if (!GAME_ON) return;
			if (e.which === 87 && mySnake.direction !== "south"){
				snake.direction =	 "north";
			}
			else if (e.which == 68 && mySnake.direction !==  "west"){
				snake.direction =	 "east";
			}
			else if (e.which == 83 && mySnake.direction !==  "north"){
				snake.direction =	 "south";
			}
			else if (e.which == 65 && mySnake.direction !==  "east"){
				snake.direction =	 "west";
			}
			
			socket.emit('movePlayer', {
				direction: snake.direction
			});
			
/*			// quit
			else if (e.which === 27) {
				clearInterval(interval);
			} */
		}));
	}
}

SnakeView.prototype = {
}



var FaceModel = function(size, faceIdx) {
	this.size = size;
	
	var fillerArray = _.range(0, size);
	this.grid = _.map(fillerArray, function (x) {
		return _.map(fillerArray, function (y) {
			return new CellModel(faceIdx, x, y);
		});
	}); 
}

FaceModel.prototype = {
	
}

asEvented.call(FaceModel.prototype);


// TODO: add FaceView, which will be a wrapper and event handler and emitter for
// a single canvas object.

	
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
	},
	
	isEmpty: function(cell) {
		
		// TODO (not urgent): put in support for not just empty cells and snake cells, but cells with food.
		
		var location = cell.getLocation(),
			faceIdx = location.faceIdx,
			x = location.x,
			y = location.y;
			
		return this.faces[faceIdx].grid[x][y].state !== 'snake';
	}
	
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
			
			
			// TODO: the eight special cases of when it's tilted 90 degrees in either direction.
			
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
	
	// TODO: Flesh this out. This will be the thing that renders all the canvas
	// objects, and keeps them in proper orientation to each other, and to the viewer..


	
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
	}
}

// TODO: cannibalize all functionality from the rest of this document
// (or at lest from the canvas constructor) and put it into various views above.

var Canvas = function(elementId, field, size) {		
	var self = this;
	
	this.size = size;
	
	this.el = document.getElementById(elementId);
	this.el.width = size * BLOCK_HEIGHT;
	this.el.height = size * BLOCK_HEIGHT;
	
	var c = this.ctx = this.el.getContext("2d");
	
	// Styling
	c.lineCap = LINE_CAP;
	c.lineJoin = LINE_JOIN;
	c.lineWidth = 1;		
	c.strokeStyle = c.fillStyle = BACKGROUND_COLOR;

	
	// Clear screen
	c.fillRect( 0, 0, size * BLOCK_HEIGHT, size * BLOCK_HEIGHT);
	
	var drawCell = function(location, color) {
		
		c.fillStyle = color;
		var left = location.x * BLOCK_HEIGHT + 1;
		var top = location.y * BLOCK_HEIGHT + 1;
		c.fillRect( left, top, BLOCK_HEIGHT, BLOCK_HEIGHT );
		c.strokeRect( left, top, BLOCK_HEIGHT, BLOCK_HEIGHT );			
	}
	this.drawCell = drawCell;
	
	eraseCell = function(location) {
		c.fillStyle = BACKGROUND_COLOR;
		var left = location.x * BLOCK_HEIGHT + 1;
		var top = location.y * BLOCK_HEIGHT + 1;
		c.fillRect( left, top, BLOCK_HEIGHT, BLOCK_HEIGHT );
	}
	
	var render = function() {
		_.each(field.snakes, function(snake) {
			var c = self.ctx;	

			drawCell(snake.body[0], snake.color);	
			
		});
	};
	
	var step = function() {
		// Renders first, so we don't even need to have a startSnake method.
		render();
		field.step();
	}
	
	this.init = function(){
		setInterval(function(){
			step();
		}, INTERVAL_TIME);
	}
}

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





