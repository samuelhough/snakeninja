// TO RECAP THE REMAINING TODOS (all detailed where they occur in the program):

// 1. SET UP CSS AND HTML STARTING ARRANGMEMENT.

// 2. MAKE THE CANVAS_ROTATION_MAP, AND ALL THE METHODS 
// AND EVENT EMITTERS AND LISTENERS THAT USE IT TO MOVE 
// THE VIEWS AROUND WITH RESPECT TO THE VIEWER.

// THEN I THINK WE'RE DONE!

// (UNTIL WE WANT TO ADD SUPPORT FOR SNAKES EATING FOOD.)

// UPDATE: Here is the text of an email I sent just after writing that recap above.
// I'll go through and make it into more coherent TODOs later.

/*

Thinking out loud again, for my own benefit as well as yours if you're looking at or working on the code:

I probably won't be able to get to this for a few days, but here are some thoughts and realizations I've had since I pushed the main bulk of what I had done on Saturday night:

1. The rotation of the cube will be both easier and harder than I had thought. 

Easier because of the -webkit-transform-style property, which will allow us to set up one parent element to rotate and not have to worry about rotating and translating all the individual faces, once we've got their initial positions set up (an excellent demo of this can be found at http://www.webkit.org/blog-files/3d-transforms/transform-style.html. Just mouse over the image to see what this property does). In the cubetest.html file I sent last night, the parent element I used was an invisible square div sandwiched into the middle of the cube along the x and y axes, of the same width and height as all the faces.

Harder because it turns out transforms are not cumulative. Even if you do different kinds of transforms, like a rotateX transform and then a translateZ transform, the second one will wipe out the first one, because they are all converted behind the scenes into matrix transforms, which are not cumulative. So we have to keep track of how the cube has been rotated, and how to determine the next absolute rotation from the current absolute rotation plus the next relative rotation. We can actually figure out the current rotation of the cube parent element from the current matrix transform values (there are websites which explain how to do this using trigonometry), but it's easier just to keep track ourselves, I think.

2. I forgot to account for the fact that people's keypresses will have to be converted into different directions for the snake model, because the x and y axes on the currently viewed face model might not be the same as the ones the viewer is seeing.

3. I'm pretty sure I forgot to account for the fact that the 'leavingFace' event emitted by the snake should have no effect if the snake is the other player, because that's all about adjusting the view for the viewer. The easiest way to fix this would be to reinstitute the 'otherPlayer' property of the snake, which I had taken out. 

4. (optional, but could theoretically make life a lot easier): It would perhaps make it easier to create more DRY and logical rotation and transformation maps and methods if we changed the directions 

'east', 'north', 'west', 'south' 

into

 'x+', 'y-', 'x-', 'y+', 

and even more so if we changed the face indices 

0, 1, 2, 3, 4, 5 

into 

'z-', 'x+', 'y-', 'x-', 'y+', 'z+'

This is just according to my arbritrary drawing from before. Once we replaced these in my transformation map we could easily change the order in the code so it made more sense to look at when reading, into x-, x+, y-, y+, z-, z+. (The relative positions of the x and y axes on all the faces would still have to be arbitrary, though.)

*/


define([
    'jquery',
    'lodash',
    'app/config',
    'app/setup',
    'app/snake',
    'app/cube_view'
], function (
    $,
    _,
    config,
    setup,
    Snake,
    CubeView
) {
    return function() {
        var socket = setup.socket;
        var addMsg = setup.addMsg;

    	var thisSnake, 
    		otherSnake, 
    		cubeView = new CubeView(config),
    		cube = cubeView.model;

    	socket.on('thisPlayerData', function(data){
    		var color = data.color,
    			location = data.location,
    			startingCell = cube.faces[location.faceIdx].grid[location.x][location.y],
    			direction = (location.y < 20) ? "south" : "north";

    		console.log("location, from socket.on('thisPlayerData'): ");
    		console.dir(location);

    		console.log("about to instantiate thisSnake:");
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

    		console.log("about to instantiate otherSnake:");
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

    	cube.on('endGame', function() {
    		socket.emit('playerDeath');
    	});

    	// Event handlers for snakes.

    	// Other player:
    	socket.on('receivePlayerDirection', function(data) {
    		otherSnake.trigger('receiveSnakeDirection', data);
    		console.log("data from socket.on('receivePlayerDirection'): ");
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
        
    };
});




	
