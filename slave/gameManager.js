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
			var colors = ["red", "green"];
			var pos = [{x: 5,y:5}, {x: 10, y: 10}]
			var addPlayer = function(){
				var thisColor = colors.pop()
				var otherPlayerColor = colors.pop();
				var position = pos.pop();
				var playerObj = { 
					pid: Math.random(),
					index: _players.length
					color: thisColor,
					otherPlayerColor: otherPlayerColor
					pos: position
				};
				pos.push(position);
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
			console.log('player count is')
			for(var cur = 0; cur < openGames.length; cur++){
				console.log('getting palyers')
				var x =openGames[cur].getPlayerNum();
				console.log("x"+x)
				pCount += openGames[cur].getPlayerNum();
			}
			console.log("pcount "+pCount)
			return pCount;

		}

		return {
			findGame: findGame,
			returnGames: returnGames,
			removeGame: removeGame,
			
			currentPlayerCount: currentPlayerCount
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

    	
  	  	var thisPlayer = game.addPlayer();
 		game.players = game.getPlayerNum();

		socket.emit('userConnected','you join '+roomId);

		
		socket.in(roomId).broadcast.emit('otherPlayerJoin', {
			x: thisPlayer.pos.x,
			y: thisPlayer.pos.y,
			color: thisPlayer.color
		});
		
		socket.on('sendPlayerData', function(data){
			socket.in(roomId).broadcast.emit('otherPlayerJoin', data);
		})
		
		socket.emit('thisPlayerData', {
			x: thisPlayer.pos.x,
			y: thisPlayer.pos.y,
			color: thisPlayer.otherPlayerColor
		});

		socket.on('set_player_name', function(data){
			thisPlayer.player_name = data;
			socket.in(roomId).broadcast.emit('otherPlayerNameChange', data);
		});




		socket.on('disconnect', function () {
			console.log("DISCONNECT");
			console.log(arguments)
			game.removePlayer();
			game.players = game.getPlayerNum();

    		socket.in(roomId).broadcast.emit('disconnect')
  		});

  		socket.on('movePlayer', function(data){
  			socket.in(roomId).broadcast.emit('receivePlayerPos', data);
  		});

  		socket.on('gameOver', function(){
  			console.log('removing room '+roomId)
  			games.removeGame(roomId);
  			socket.emit('refreshPage');

  			socket.in(roomId).broadcast.emit('refreshPage')
  		});


  		socket.on('chat', function(data){
  			console.log(data)
  			socket.in(roomId).broadcast.emit('chat', data);
  		});
	});

	return {
		on: on,
		trigger: trigger,
		returnGames: games.returnGames,
		currentPlayerCount: games.currentPlayerCount
	};
}());