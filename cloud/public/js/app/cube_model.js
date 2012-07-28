define(['utils/make_evented_constructor'], function(makeEventedConstructor) {
    
    return  makeEventedConstructor({

    	init: function(size, faces) {
    		this.size = size;
    		this.snakes = [];

    		this.faces = faces;
    	},

    	addSnake: function(snake) {
    	    var self = this;
    		snake.on('leavingFace', function(transitObj) {

    			// TODO: Flesh this out. This needs to use the 'from' and 'to' face indices
    			// to determine the axis of rotation (using yet another arbitrary map, probably)
    			// and then it needs to call the 'rotate' method on all six of the faces, using
    			// the axis identifier.

    			// OH NO WAIT! THIS IS ACTUALLY A BIT TRICKIER THAN THAT. THE 'FROM' AND 'TO' INDICES,
    			// AS CURRENTLY WRITTEN, ONLY REFER TO THE MODEL RELATIONSHIPS, NOT TO THE ACTUAL CURRENT
    			// POSITION OF THE FACES AS SEEN BY THE USER. MUST DO SOMETHING ABOUT THAT. PERHAPS STORE DYNAMIC TRANSFORM 
    			// MAPS SO THAT MODEL INDICES CAN ALWAYS BE USED TO FIND CURRENT UI POSITION.

    		});

    		snake.on('hasHitObstacle', function() {
    			self.trigger('endGame');
    		});

    		this.snakes.push(snake);
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
});

