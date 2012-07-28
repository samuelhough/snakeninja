define([
    'utils/make_evented_constructor',
    'app/cell'
], function(
    makeEventedConstructor,
    Cell
) {
    
    return makeEventedConstructor({

    	init: function(size, faceIdx) {

    		this.size = size;
            var self = this;

    		var fillerArray = _.range(0, size);

    		this.grid = _.map(fillerArray, function (x) {
    			return _.map(fillerArray, function (y) {
    				var newCell = new Cell({
    					faceIdx: faceIdx, 
    					x: x, 
    					y: y
    				});
    				newCell.on('change', function(cell) {
            			self.trigger('cellChange', cell);
            		});
    				return newCell;
    			});
    		}); 
    	}
    });
});

