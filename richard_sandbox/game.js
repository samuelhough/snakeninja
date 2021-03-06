
	var LINE_CAP = 'butt';
	var LINE_JOIN = 'miter';
	var INTERVAL_TIME = 100; // microseconds
	var BLOCK_HEIGHT = 10;
	var GRID_SIZE = 40; // just make sure BLOCK_HEIGHT is divisible by GRID_SIZE, for now.
	var PLAYER_ONE_COLOR = "#39c63f";
	var PLAYER_TWO_COLOR = "#c73e92";
	var BACKGROUND_COLOR = "#fff";
	
	var DIRECTIONS = {
		north: 0,
		east: 1,
		south: 2,
		west: 3
	};
	
	var helpers = {
		// very cheap version. Hacky.
		mod: function(dividend, modulo) {
			while (dividend < 0) {
				dividend += modulo;
			}
			return dividend % modulo;
		}
	}
	
	var Snake = function(color, field) {
		
		var self = this;
		
		this.needsToBeRendered = true;
		this.color = color;
		this.direction = Math.floor(Math.random() * 4);
		
		// an array of x-y coordinates.
		this.body = [];
		
		// JUST FOR INITIAL TEST:
		this.maxLength = 10;
		// END OF INITIAL TEST CODE.
		
		// Init code
		do {
			this.body[0] = {
				x: Math.floor(Math.random() * field.size),
				y: Math.floor(Math.random() * field.size)
			}
		} while (!field.isEmpty(this.body[0]));
				
		this.move = function() {
			var dx = 0, 
				dy = 0,
			    newHead;
				
			switch(this.direction) {
				case DIRECTIONS.north: dy -= 1; break; 
				case DIRECTIONS.east:  dx += 1; break; 
				case DIRECTIONS.south: dy += 1; break; 
				case DIRECTIONS.west:  dx -= 1;			
			}
			
			newHead = {
				x: this.body[0].x + dx,
				y: this.body[0].y + dy
			};
			
			if (field.isInBounds(newHead) && field.isEmpty(newHead)) {
				this.body.unshift(newHead);
				field.grid[newHead.x][newHead.y] = 1;

				
				this.needToAddHead = true;				
				if (this.body.length > this.maxLength) {
					this.body.length -= 1;
					var tail = this.body[this.body.length - 1];
					field.grid[tail.x][tail.y] = null;
				
					this.needToRemoveTail = true;
				}
			} else {
				this.needToAddHead = false;
				this.needToRemoveTail = false;
				if (field.isSurrounded(location)) {
					// TODO: Have something actually happen when the user can't move any more. 	
				}
			}
		}
	}
	
	var Field = function(size) {
		
		var self = this;

		this.size = size;
		this.snakes = [];
		this.grid = _.map(_.range(0, size), function () {
			return []; 
		});	
		
		this.addSnake = function(snake) {
			this.snakes.push(snake);
		}
		
		this.isInBounds = function(location) {
			var x = location.x;
			var y = location.y;
			var inbounds = (x >= 0 && x < size && y >= 0 && y < size);

			return inbounds;
		}
		
		this.isEmpty = function(location) {
			return !this.grid[location.x][location.y];
		}
		
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


	var Canvas = function(elementId, field, size) {
		
		var self = this;
		
		this.size = size;
		
		this.el = document.getElementById(elementId);
		this.el.width = size * BLOCK_HEIGHT;
		this.el.height = size * BLOCK_HEIGHT;
		
		var c = this.ctx = this.el.getContext("2d");
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
		
		eraseCell = function(location) {
			c.fillStyle = BACKGROUND_COLOR;
			var left = location.x * BLOCK_HEIGHT + 1;
			var top = location.y * BLOCK_HEIGHT + 1;
			c.fillRect( left, top, BLOCK_HEIGHT, BLOCK_HEIGHT );
		}
		
		var render = function() {
			_.each(field.snakes, function(snake) {
				var c = self.ctx;
				if (snake.needToAddHead) {
					drawCell(snake.body[0], snake.color);
				}
				if (snake.needToRemoveTail) {
					eraseCell(snake.body[snake.body.length - 1]);
				}
			});
			
		}
		this.step = function() {
			// Renders first, so we don't even need to have a startSnake method.
			render();
			field.step();
		}
	}

	var field = new Field(GRID_SIZE);
	var snakeOne = new Snake(PLAYER_ONE_COLOR, field);
	var snakeTwo = new Snake(PLAYER_TWO_COLOR, field);
	field.addSnake(snakeOne);
	field.addSnake(snakeTwo);
	
	var canvas = new Canvas('mainCanvas', field, GRID_SIZE);
	
	var interval = setInterval (canvas.step, INTERVAL_TIME);
	
	// Event handlers:
	// (THIS FIRST ONE IS TEST ONLY):
	
	$('body').on('keydown', function(e) {
		var direction = snakeOne.direction;
		console.log(e.which);

		if(e.which === 87){
			if(snakeOne.direction !== DIRECTIONS["south"])
				snakeOne.direction =  DIRECTIONS["north"];
		}
		if(e.which == 68){
			if(snakeOne.direction !==  DIRECTIONS["west"])
				snakeOne.direction =  DIRECTIONS["east"];

		}

		if(e.which == 83){
			if(snakeOne.direction !==  DIRECTIONS["north"])
				snakeOne.direction =  DIRECTIONS["south"];
			
		}

		if(e.which == 65){
			if(snakeOne.direction !==  DIRECTIONS["east"])
				snakeOne.direction =  DIRECTIONS["west"];
			
		}
		

		// quit
		if (e.which === 27) {
			clearInterval(interval);
		}
		
	});
	