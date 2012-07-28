define([
    'utils/make_evented_constructor',
    'app/face_model'
], function(
    makeEventedConstructor,
    FaceModel
) {
    
    return makeEventedConstructor({

    	init: function(position, domId, config) {
    	    var size = config.GRID_SIZE;
    	    var model = new FaceModel(size, position);

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
            
            console.log(this)
            console.log(this.el)
            
    		var c = this.ctx = this.el.getContext('2d');

    		// Styling
    		c.lineCap = config.LINE_CAP;
    		c.lineJoin = config.LINE_JOIN;
    		c.lineWidth = 1;
    		c.strokeStyle = c.fillStyle = config.BACKGROUND_COLOR;

    		// Clear canvas
    		c.fillRect( 0, 0, size * config.BLOCK_HEIGHT, size * config.BLOCK_HEIGHT);

    		// Set event handler.
    		var self = this;
    		this.on('cellChange', function(cell) {
    			var location = cell.getLocation();
    			var color = cell.color;
    			if (color) {
    				self.drawCell(location.x, location.y, color);
    			} else {
    				self.eraseCell(location.x, location.y);
    			}
    		});
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
    	},

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
});