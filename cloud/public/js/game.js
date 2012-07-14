// TO RECAP THE REMAINING TODOS (all detailed where they occur in the program):

// 1. SET UP CSS AND HTML STARTING ARRANGMEMENT.

// 2. MAKE THE CANVAS_ROTATION_MAP, AND ALL THE METHODS 
// AND EVENT EMITTERS AND LISTENERS THAT USE IT TO MOVE 
// THE VIEWS AROUND WITH RESPECT TO THE VIEWER.

// THEN I THINK WE'RE DONE!

// (UNTIL WE WANT TO ADD SUPPORT FOR SNAKES EATING FOOD.)

;

var Game = (function() {
	
	var config = {
		LINE_CAP: 'butt',
		LINE_JOIN: 'miter',
		INTERVAL_TIME: 100, // microseconds
		BLOCK_HEIGHT: 10,
		GRID_SIZE: 50,
		BACKGROUND_COLOR: '#fff',

		// This is the map of which edges are next to which other edges, when you
		// glue them all together. This is used by the cube.adjacentCell method.
		// It is an arbitrary map and the CSS for the actual rendering will have to correspond to it.
		// (The top-level indices are face numbers.)

		DIRECTIONS_TRANSFORM_MAP = {
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
		}	
	}


	var makeEventedConstructor = function(proto) {
		var expose = function(){
			this.init.apply(this, arguments);
		};

		// Gets overridden if the caller provides its own version (which it should).
		expose.prototype.init = function(){};

		$.extend(expose.prototype, proto);
		asEvented.call(expose.prototype);

		return expose;
	};


	var CellModel = makeEventedConstructor({

		init: function(location){

			// _state contains a reference to a snake object,
			// or null. (In the future maybe it might also contain
			// a reference to a food object, or maybe just the string 'food').

			this._state = null;

			// READ-ONLY location object
			this._location = {
				faceIdx: faceIdx,
				x: x,
				y: y
			}		
		},

		getLocation: function() {
			return this._location;
		},

		getState: function() {
			return this._state;
		},

		setState: function(state) {
			if (state !== this._state) {
				this._state = state;
				this.trigger('change', this)
			}
		},

		isEmpty: function() {
			return this._state === null;
		}

	});


	var SnakeModel = makeEventedConstructor({

		init: function(color, startingCell, direction) {

			this.direction = direction;

			// READ-ONLY
			this._color = color;
			this._isOtherPlayer = isOtherPlayer;

			// an array of cells.
			this.body = [];

			this.body[0] = startingCell;
			startingCell.setState(this);
			console.log(this.body);

			// Event handler

			this.on('receiveSnakeDirection', $.proxy(function(data) {
				this.direction = data.direction;
			}, this));
		},

		getColor: function() {
			return this._color;
		},

		addNewHead: function(newHead) {
			this.body.unshift(newHead);
			newHead.setState(this);
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
		}

		move: function() {
			var currentHeadFaceIdx = this.body[0].location.faceIdx,
				nextHeadFaceIdx = this._nextHead.location.faceIdx;

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


	var FaceModel = makeEventedPrototype({

		init: function(size, faceIdx) {

			this.size = size;

			var handleChange = $.proxy(function(cell) {
				this.trigger('cellChange', cell);
			}, this);

			var fillerArray = _.range(0, size);

			this.grid = _.map(fillerArray, function (x) {
				return _.map(fillerArray, function (y) {
					var newCell = new CellModel(faceIdx, x, y);
					newCell.on('change', handleChange);
					return newCell;
				});
			}); 
		}
	});


	var FaceView = makeEventedConstructor({

		init: function(face, position, domId) {
			this.size = face.size;

			// Position is a number from 0 to 5. It starts out corresponding
			// exactly to the faceView's model's index in the faces array of the CubeModel, 
			// but instead of being a permanent
			// ID for the face (which the faces indices are, in the CubeModel),
			// position is just where the face happens to be located at the moment,
			// in the UI. 

			// TODO: The starting arrangement, tied to DOM ids which correspond to the 
			// faces indices (face-0, face-1, etc.) will be specified in the CSS stylesheet.

			this.position = position;

			this.el = document.getElementById(domId);
			this.el.width = size * config.BLOCK_HEIGHT;
			this.el.height = size * config.BLOCK_HEIGHT;

			var c = this.ctx = this.el.getContext('2d');

			// Styling
			c.lineCap = config.LINE_CAP;
			c.lineJoin = config.LINE_JOIN;
			c.lineWidth = 1;
			c.strokeStyle = c.fillStyle = config.BACKGROUND_COLOR;

			// Clear canvas
			c.fillRect( 0, 0, size * config.BLOCK_HEIGHT, size * config.BLOCK_HEIGHT);

			// Set event handler.
			this.on('cellChange', $.proxy(function(cell) {
				var location = cell.getLocation();
				var color = cell.getState().color;
				if (color) {
					this.drawCell(location.x, location.y, color);
				} else {
					this.eraseCell(location.x, location.y);
				}
			}, this));
		},

		_draw: function(location, color) {
			var x = location.x,
				y = location.y;

			var c = this.ctx;
			c.fillStyle = color;

			var left = x * config.BLOCK_HEIGHT + 1;
			var top = y * config.BLOCK_HEIGHT + 1;
			c.fillRect( left, top, config.BLOCK_HEIGHT, config.BLOCK_HEIGHT );
			c.strokeRect( left, top, config.BLOCK_HEIGHT, config.BLOCK_HEIGHT );
		},

		drawCell: function(cell) {
			this._draw(cell.location, cell.state.color);
		},

		eraseCell: function(cell) {
			this._draw(cell.location, config.BACKGROUND_COLOR);
		}

		rotate: function(axis) {

			// TODO: The CANVAS_ROTATION_MAP is not made yet. It will consist
			// of six different rotations, with property names 
			// 'x-left', 'x-right', 'y-left', 'y-right', 'z-left', and 'z-right',
			// for left-handed and right-handed spin. Each of these properties
			// will be containing both the number of the new position for the 
			// canvas, and the css transforms necessary to get it there.

			// var rotationObj = CANVAS_ROTATION_MAP[axis];
			// this.position = rotationObj.newPosition;
			// $(this.el).css(rotationObj.cssTransforms);
		}

	});


	var CubeModel = makeEventedConstructor({

		init: function(size) {
			this.size = size;
			this.snakes = [];

			this.faces = _.map(_.range(0, 6), function(index) {
				return new Face(size, index);
			});
		},

		findAdjacentCell: function(cell, direction) {

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

				transform = config.DIRECTIONS_TRANSFORM_MAP[faceIdx][edge];
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

	});


	var CubeView = makeEventedConstructor({

		init: function(cube) {
			this.cube = cube;
			this.faceViews = _.map(this.cube.faces, function(face, faceIdx) {
				return new FaceView(face, faceIdx, 'face-' + faceIdx);
			});
		},

		addSnake: function(snake) {
			snake.on('leavingFace', $.proxy(function(transitObj) {

				// TODO: Flesh this out. This needs to use the 'from' and 'to' face indices
				// to determine the axis of rotation (using yet another arbitrary map, probably)
				// and then it needs to call the 'rotate' method on all six of the faces, using
				// the axis identifier.

				// OH NO WAIT! THIS IS ACTUALLY A BIT TRICKIER THAN THAT. THE 'FROM' AND 'TO' INDICES,
				// AS CURRENTLY WRITTEN, ONLY REFER TO THE MODEL RELATIONSHIPS, NOT TO THE ACTUAL CURRENT
				// POSITION OF THE FACES AS SEEN BY THE USER. MUST DO SOMETHING ABOUT THAT. PERHAPS STORE DYNAMIC TRANSFORM 
				// MAPS SO THAT MODEL INDICES CAN ALWAYS BE USED TO FIND CURRENT UI POSITION.

			}, this));

			snake.on('hasHitObstacle', $.proxy(function() {
				clearInterval(this.gameInterval);
				this.trigger('endGame');
			}, this));

			this.snakes.push(snake);
		},

		stepSnakes: function() {
			var findAdjacentCell = this.cube.findAdjacentCell;

			_.each(this.snakes, function(snake) {
				var direction = snake.direction;
				var cell = snake.body[0];
				var adjacentCell = findAdjacentCellFunc(cell, direction);
				snake.evaluateMoveTo(adjacentCell);
			});

			if (this.gameOn) {
				_.each(this.snakes, function(snake) {
					snake.move();
				});
			}
		},

		makeItSo: function() {
			this.gameInterval = setInterval(function() {
				this.stepSnakes();
			}, config.INTERVAL_TIME);
		}
	});


	var Game = makeEventedConstructor({

		init: function(app) {

			var socket = app.socket,
				addMsg = app.addMsg,
				thisSnake, 
				otherSnake, 
				cube = new CubeModel(config.GRID_SIZE),
				cubeView = new CubeView(cube);

			socket.on('thisPlayerData', function(data){
				var color = data.color,
					location = data.location,
					startingCell = cube.faces[location.faceIdx].grid[location.x][location.y],
					direction = (location.y < 20) ? "south" : "north";

				console.log(location);

				thisSnake = new Snake(color, startingCell, direction);
				cube.addSnake(thisSnake);	

			});

			var otherPlayerCalled = false;

			socket.on('otherPlayerJoin', function(data) {

				if (otherPlayerCalled) { 
					socket.emit('gameReady');
					return; 
				} 
				else { 
					otherPlayerCalled = true;			
				}
				addMsg("Another player has joined the game");

				var color = data.color,
					location = data.location;
					startingCell = cube.faces[location.faceIdx].grid[location.x][location.y],
					direction = (location.y < 20) ? "south" : "north";

				otherSnake = new Snake(color, startingCell, direction);
				cube.addSnake(otherSnake);	

				socket.emit('sendPlayerData', {
					location: location,
					color: color
				});
			});

			socket.on('gameStart', function(){
				addMsg("The game is ready to start.	 Starting in 5 seconds....");
				var timeTillStart = 5;

				var startMsg = setInterval(function(){
					if(timeTillStart === 0){  
						addMsg('Start!');
						cubeView.makeItSo();
						clearInterval(startMsg);
					}
					addMsg(timeTillStart+"...");
					timeTillStart -= 1;

				}, 1000);
			});

			cubeView.on('endGame', function() {
				socket.emit('playerDeath');
			});

			// Event handlers for snakes.

			// Other player:
			socket.on('receivePlayerDirection', function(data) {
				otherSnake.trigger('receiveSnakeDirection', data);
				console.log(data.faceIdx + " " + data.x + " " + data.y);			
			});

			// This player:
			$('body').on('keydown', $.proxy(function(e) {

				console.log(e.which);
				if (!config.GAME_ON) return;
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

				var oppositeDirection = function(dir) {
					if (dir === 'north') return 'south';
					if (dir === 'south') return 'north';
					if (dir === 'east') return 'west';
					if (dir === 'west') return 'east';
				};

				if (newDirection && 
							newDirection !== snake.direction && 
							newDirection !== oppositeDirection(snake.direction)) {
					
					thisSnake.trigger('receiveSnakeDirection', {
						direction: newDirection
					});
					socket.emit('movePlayer', {
						direction: newDirection
					});
				}
			}, this));
		}
	});
	
	return {
		Game: Game
	};

})();

$(function() {
	new Game(app);
});


	
