
	var LINE_CAP = 'butt';
	var LINE_JOIN = 'miter';
	var INTERVAL_TIME = 100; // microseconds
	var BLOCK_HEIGHT = 10;
	var GRID_SIZE = 50;
	var PLAYER_ONE_COLOR = "#39c63f";
	var PLAYER_TWO_COLOR = "#c73e92";
	var BACKGROUND_COLOR = "#fff";	
	var GAME_ON = false;
	var FIELD_NUM = 1;
	
	var DIRECTIONS = {
		"east": 0,
		"north": 1,
		"west": 2,
		"south": 3,
		
		"0": 0,
		"90": 1,
		"180": 2,
		"270": 3
	};
	
	var helpers = {
		// Because the % operator doesn't work with negative dividends.
		mod: function(dividend, modulo) {
			if (dividend < 0) {
				dividend += (-1 * Math.floor(dividend / modulo) * modulo);
			}
			return dividend % modulo;
		}
	}
	
	var SnakeModel = function(color, location, cube, otherPlayer) {
		
		var self = this;
		this.color = color;
		
		// an array of cells.
		this.body = [];
		
		// JUST FOR INITIAL TEST:
		this.maxLength = 100;
		// END OF INITIAL TEST CODE.
		
		// Init code
		
		this.body[0] = location;
		console.log(this.body);
		
		this.addBodySegment = function(cell){
			this.body.unshift(cell);
			cube.setCellValue(cell, 'snake');
		};
		
		this.sendData = function(){
			if (otherPlayer) { 
				return;
			}
			socket.emit("movePlayer", { 
				location: self.location 
			});
		}
		var intervalMe = setInterval(this.sendData, 10);
		
		this.move = function() {
			if (otherPlayer) return;
			
			var newHead = cube.adjacentCell(this.body[0], this.direction);
				
			if (cube.isEmpty(newHead)) {
				this.addBodySegment(newHead);
			} 
			else {
				GAME_ON = false;
				socket.emit("PlayerDeath");
			}
		}
	}

	var CellModel = function(face, x, y){ 
		this.location = {
			face: face,
			x: x,
			y: y
		};
		this.currentState = null;
		this.nextState = null;
	};
	
	var FaceModel = function(size, fieldNum) {		
		var self = this;

		this.size = size;
		var fillerArray = _.range(0, size);
		this.grid = _.map(fillerArray, function (x) {
			return _.map(fillerArray, function (y) {
				return new CellModel()
			})
			
			
			[]; 
		}); 
		
		this.isSurrounded = function(location) {
			var isEmpty = this.isEmpty;
			
			var dx_range = [-1,0,1];
			var dy_range = [-1,0,1];
			_.each(dx_range, function (column) {
				_.each(dy_range, function (row) {
					if (self.isInBounds(location) && self.isEmpty(location)) {
						return false;
					}
				});
			});
			return true;
		}
		
		this.step = function() {
			_.each(this.snakes, function(snake) {
				snake.move();
			})
		}
		this.setPos = function(m,x,y){
			this.grid[x][y] = 1;
		}
	}
	
	var CubeModel = function(){
		
		var faceFiller = _.range(0, 6);
		var sizeFiller = _.range(0, size);

		this.grid = _.map(faceFiller, function(face) {
			return _.map(sizeFiller, function(x) {
				return _.map(sizeFiller, function(y) {
					return new CellModel(face, x, y);
				});
			});
		});
		
		this.addSnake = function(snake) {
			this.snakes.push(snake);
		}
		
		this.isEmpty = function(location) {
			return !this.grid[location.face][location.x][location.y].currentState;
		}

	};
	
	FaceModel.prototype.isInBounds = function(cell) {
		var x = cell.location.x,
			y = cell.location.y,
			size = this.size;
			
		return (x >= 0 && x < size && y >= 0 && y < size);
	}
	
	
	CubeModel.prototype.adjacentCell = function(cell, direction) {
		var FACE_ROTATION_MAP = [
			[]
		];
		
		var adjacentCell = cell;
		if (direction === DIRECTIONS["east"]) {
			adjacentCell.
		}
	}
	
	
	


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
				location = data.location;	
				console.log(location);
			mySnake = new Snake(color, location, cube);		
			cube.addSnake(mySnake);	
			if(location.y < 20){
				mySnake.direction = DIRECTIONS["south"];
			}
			if(location.y > 20){
				mySnake.direction = DIRECTIONS["north"];
			}
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

		// Set the event listeners for the otehr snake. 
		socket.on('receivePlayerPos', function(data) {
			console.log(data.x + " " + data.y);
			otherSnake.addPoint(data);
			canvas.drawCell(data, otherSnake.color);
		});



	
	
	// Event handlers:
	// (THIS FIRST ONE IS TEST ONLY):	
	$('body').on('keydown', function(e) {
		console.log(e.which);
		if(!GAME_ON){ return; };
		if(e.which === 87 && mySnake.direction !== DIRECTIONS["south"]){
			mySnake.direction =	 DIRECTIONS["north"];
	//		socket.emit('movePlayer', {dir: 'north'});
		}
		
		if(e.which == 68 && mySnake.direction !==  DIRECTIONS["west"]){
			mySnake.direction =	 DIRECTIONS["east"];
	//		socket.emit('movePlayer', {dir: 'east'});
		}

		if(e.which == 83 && mySnake.direction !==  DIRECTIONS["north"]){
			mySnake.direction =	 DIRECTIONS["south"];
	//		socket.emit('movePlayer', {dir: 'south'});			
		}

		if(e.which == 65 && mySnake.direction !==  DIRECTIONS["east"]){
			mySnake.direction =	 DIRECTIONS["west"];
	//		socket.emit('movePlayer', {dir: 'west'});			
		}
		

		// quit
		if (e.which === 27) {
			clearInterval(interval);
		}
		
	});