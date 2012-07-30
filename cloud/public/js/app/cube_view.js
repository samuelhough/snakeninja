define([
    'lodash',
    'utils/make_evented_constructor',
    'app/face_view',
    'app/cube_model'
    'app/snake'
], function(
    _,
    makeEventedConstructor,
    FaceView,
    CubeModel,
    Snake
) {
    
    return makeEventedConstructor({

    	init: function(config) {
    	    
    	    var size = config.GRID_SIZE;
    	    var this.snakes = [];

    		this.faceViews = _.map(_.range(0, 6), function(index) {
    			return new FaceView(index, 'face-' + index, config);
    		});

            var faces = _.map(this.faceViews, function(view) {
                return view.model;
            });

    		this.model = new CubeModel(size, faces);
    		this.model.on('endGame', function() {
    			clearInterval(this.gameInterval);
    		})
    	},
      	
    	
    	addSnake: function(color, startingCell, direction) {
    	    var snake = new Snake(color, startingCell, direction);
    	    
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
    		return snake;
    	},

    	

    	stepSnakes: function() {

    		_.each(this.model.snakes, function(snake) {
    			var direction = snake.direction;
    			var cell = snake.body[0];

    			var adjacentCell = (function(cube) {
    			    cube.findAdjacentCell(cell, direction);
    			})(this.model);

    			snake.evaluateMoveTo(adjacentCell);
    		});

    		if (this.gameOn) {
    			_.each(this.snakes, function(snake) {
    				snake.move();
    			});
    		}
    	},

    	makeItSo: function() {
    		var stepSnakes = _.bind(this.stepSnakes, this);
    		this.gameInterval = setInterval(stepSnakes, config.INTERVAL_TIME);
    	}
    });
});
