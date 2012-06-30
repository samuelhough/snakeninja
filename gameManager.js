module.exports = (function(){
	var events = [];
	var on = function(type, fn){
		if(typeof type !== 'string' || typeof fn !== 'function'){ return; }
		
		if(!events[type]){ 
			events[type] = [fn];
		}
		else {
			events[type].push(fn);
		}
	};
	var trigger = function(eventName, data){
		if(!events[eventName]){ events[eventName] = [] }
		for(var cur = 0; cur < events[eventName].length; cur ++){
			try{
				events[eventName][cur](data)
			} catch(e){
				console.log(e);
			}
		}
	};


	var games = (function(){
		var openGames = [];

		var gameClass = function(){
			var _players = [],
				players = 0,
				roomId = Math.round(Math.random() * 10000000000);
			var getId = function(){

			}
			var addPlayer = function(){
				var pid = Math.random();
				_players.push(pid);
				players = _players.length;
				return pid;
			}
			var getPlayers = function(){
				return _players;
			}
			var getPlayerNum = function(){
				return _players.length;
			}
			var removePlayer = function(){
				_players.pop();
				players = _players.length;
				if(players === 0){
					removeGame(roomId);
				}
			}
			function addSocket(){}
			
			return {
				getPlayerNum: getPlayerNum,
				getPlayers: getPlayers,
				roomId: roomId,
				getId: getId,
				players: players,
				addPlayer: addPlayer,
				removePlayer: removePlayer,
				addSocket: addSocket
			}	
			
		};
		var createGame = function(){
			console.log('creating game')
			var game = gameClass();
			openGames.push(game);
			return game;
		}
		var addUserToGame = function(){

		}
		var findGame = function(socketConnection){
			var game;
			if(openGames.length <= 0){
				game = createGame();

			}else {
				for(var cur = 0; cur <  openGames.length; cur ++){
					if(openGames[cur].getPlayerNum() === 1){
						game = openGames[cur];
					}
				}
				if(!game){ 
					console.log('no game')
					game = createGame(); 
				}
			}
			return game;
		}
		function returnGames(){ return openGames; }
		function removeGame(roomId){ 
			for(var cur = 0; cur < openGames.length; cur ++){
				if(openGames[cur].roomId === roomId){
					openGames.splice(cur, 1);
					return;
				}
			}
		}
		return {
			findGame: findGame,
			returnGames: returnGames,
			removeGame: removeGame
		}
	}())



	on('newConnection', function(socket){
		socket.emit('userConnected','init');
		
		var game = games.findGame(),
			roomId = game.roomId,
			userId = game.getId();
		socket.join(roomId);

		

		socket.emit('setRoomId', roomId);
		socket.emit('userConnected','init2');

    	
    	game.addPlayer();
 
    	game.players = game.getPlayerNum();

		socket.emit('userConnected','you join '+roomId);
		socket.in(roomId).broadcast.emit('newUser','user joined');

		socket.on('disconnect', function () {
			console.log("DISCONNECT");
			console.log(arguments)
			game.removePlayer();
			game.players = game.getPlayerNum();
    		socket.in(roomId).broadcast.emit('disconnect')
  		});

  		socket.on('gameOver', function(){
  			console.log('removing room '+roomId)
  			games.removeGame(roomId);
  			socket.emit('refreshPage');
  			socket.in(roomId).broadcast.emit('refreshPage')
  		});

  		socket.on('playerMove', function(data){
  			socket.in(roomId).broadcast.emit('otherPlayerData')
  		});
  		socket.on('chat', function(data){
  			console.log(data)
  			socket.in(roomId).broadcast.emit('chat', data);
  		})
	})

	return {
		on: on,
		trigger: trigger,
		returnGames: games.returnGames
	};
}());