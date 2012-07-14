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
		var gamesPlayed = 0;
		var returnGamesPlayed = function(){
			return gamesPlayed;
		}
		var gameClass = function(){
			gamesPlayed++;
			var _players = [],
				players = 0,
				roomId = Math.round(Math.random() * 10000000000);
			var getId = function(){

			}
			var colors = ["blue", "green"];
			var pos = [
				{faceIdx: 0, x: 5, y:5}, 
				{faceIdx: 0, x: 35, y: 35}
			];
			
			var addPlayer = function(){
				var thisColor = colors.pop()
				var otherPlayerColor = colors.pop();
				var position = pos.pop();
				var playerObj = { 
					pid: Math.random(),
					index: _players.length, 
					color: thisColor,
					otherPlayerColor: otherPlayerColor, 
					pos: position
				};
				colors.push(otherPlayerColor);
				colors.push(thisColor);
				_players.push(playerObj);
				players = _players.length;
				return playerObj;
			}
			var getPlayers = function(){
				return _players;
			}
			var getPlayerNum = function(){
				console.log('getplayernum')
				console.log(_players.length)
				return _players.length;
			}
			function updateIndexes(){
				for(var cur = 0; cur < _players.length; cur ++){
					_players[cur].index = cur;
				}
			}
			var removePlayer = function(){
				_players.pop();
				updateIndexes();
				players = _players.length;
				removeGame(roomId);
				
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
			var game = gameClass();

			console.log('Creating game '+game.roomId)
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
						console.log("Joining old game "+openGames[cur].roomId)
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
		
		function currentPlayerCount(){
			var pCount = 0;
			console.log('Open games are '+openGames.length);
			
			for(var cur = 0; cur < openGames.length; cur++){
				console.log('getting players')
				console.log(openGames[cur]);
				pCount += openGames[cur].getPlayerNum();
			}
			console.log('Player count is '+pCount)
			return pCount;

		}

		return {
			findGame: findGame,
			returnGames: returnGames,
			removeGame: removeGame,			
			returnGamesPlayed: returnGamesPlayed,
			currentPlayerCount: currentPlayerCount
		}
	}())



	on('newConnection', function(socket){		
		var game = games.findGame(),
			roomId = game.roomId,
			userId = game.getId(),
			thisPlayer = game.addPlayer();
			socket.join(roomId);
			
 		game.players = game.getPlayerNum();
	
		socket.emit("clientMsg", "You have joined room: " +roomId);
		if(game.players < 2){
			socket.emit("clientMsg", "Waiting for another player to join....")
			socket.emit("clientMsg", "Use WASD to move!")
		}
		socket.in(roomId).broadcast.emit('otherPlayerJoin', {
			location: thisPlayer.pos,
			color: thisPlayer.color
		});
		
		socket.emit('thisPlayerData', {
			location : thisPlayer.pos,
			color: thisPlayer.otherPlayerColor
		});
				
		socket.on('sendPlayerData', function(data) {
			socket.in(roomId).broadcast.emit('otherPlayerJoin', data);
		});
		
		socket.on('movePlayer', function(data){
			socket.in(roomId).broadcast.emit('receivePlayerDirection', data);
		});	

		socket.on('gameReady', function(){
			socket.emit('gameStart');
			socket.in(roomId).broadcast.emit('gameStart');
			socket.emit("clientMsg", "Use WASD to move!")
			socket.in(roomId).broadcast.emit("clientMsg", "Use WASD to move!");
		});
		
		
		socket.on('playerDeath', function(){
			if(game.gameOver){ return; }
			game.gameOver = true;
			socket.in(roomId).broadcast.emit('gameOver', true);
			socket.emit('gameOver', false);
		});
		
		socket.on('disconnect', function () {
			console.log(arguments);
			console.log("DISCONNECT");
			game.removePlayer();
			game.players = game.getPlayerNum();   	
			socket.in(roomId).broadcast.emit('playerQuit');		
			socket.in(roomId).emit('playerQuit');	
			socket.emit('playerQuit');
			socket.leave(roomId);
  		});

  		
		/*
			socket.on('gameOver', function(){
				console.log('removing room '+roomId)
				games.removeGame(roomId);
				socket.emit('refreshPage');

				socket.in(roomId).broadcast.emit('refreshPage')
			});

			socket.on('set_player_name', function(data){
				thisPlayer.player_name = data;
				socket.in(roomId).broadcast.emit('otherPlayerNameChange', data);
			});

			
			socket.on('chat', function(data){
				console.log(data)
				socket.in(roomId).broadcast.emit('chat', data);
			});
		*/

	});

	return {
		on: on,
		trigger: trigger,
		returnGames: games.returnGames,
		currentPlayerCount: games.currentPlayerCount,
		returnGamesPlayed: games.returnGamesPlayed
	};
}());