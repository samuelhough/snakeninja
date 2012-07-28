define([
    'lodash',
    'utils/make_evented_constructor',
    'app/face_view',
    'app/cube_model'
], function(
    _,
    makeEventedConstructor,
    FaceView,
    CubeModel
) {
    
    return makeEventedConstructor({

    	init: function(config) {
    	    
    	    var size = config.GRID_SIZE;

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
