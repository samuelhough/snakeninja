define([], function() {
    
    return config = {
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

    	DIRECTIONS_TRANSFORM_MAP: {
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
    };
});