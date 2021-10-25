const net = require('net');

// const host = '127.0.0.1';
const host = '192.168.0.106';
const port = 6969;

const players = new Map();
const sockets = new Map();
const lobby = {};

net.createServer((socket) => {
	console.log('CONNECTED: ' + socket.remoteAddress +':'+ socket.remotePort);

	socket.sendEvent = function(eventName, data) {
		let json = {eventName: eventName, data: data};
		socket.write(JSON.stringify(json)); 
	}

	socket.on('data', (data) => {
		let json = JSON.parse(data);
		socket.emit(json.eventName, json.data);
	});

	socket.on('connection', (playerData) => {
		socket.id = playerData.hash;
		sockets.set(playerData.hash, socket);

		players.set(playerData.hash, new Player(playerData));
		console.log(players);

		socket.sendEvent('connection');
		sendLobbyInfo();
	});

	socket.setTimeout(3000);
	socket.on('timeout', () => {
		console.log('socket timeout');
		// Tell the other players about the disconnect
		// Pause the game or lobby
	});

	socket.on('ping', () => { 
		socket.sendEvent('ping');
		console.log('pong');
	});

	socket.on('disconnect', () => {
		players.delete(socket.id);
		console.log(players);
	});

	socket.on('close', function(data) {
		console.log('CLOSED: ' + socket.remoteAddress +' '+ socket.remotePort);
	});
}).listen(port, host);

function sendLobbyInfo() {
	const lobby = [];
	players.forEach(player => {
		lobby.push({name: player.name, connected: player.connected, ready: player.ready});
	});
	players.forEach(player => {
		if (player.connected) {
			const socket = sockets.get(player.hash);
			socket.sendEvent('lobby', lobby);
		}
	});
}

const Player = function(playerData) {
	this.hand = [];
	this.hash = playerData.hash;
	this.name = playerData.name;
	this.connected = true;
	this.ready = false;
}
console.log('Server listening on ' + host +':'+ port);
