const net = require('net');

// const host = '127.0.0.1';
const host = '192.168.0.106';
const port = 6969;

const players = new Map();
const sockets = new Map();
const lobby = {};

net.createServer((socket) => {
	console.log('CONNECTED: ' + socket.remoteAddress +':'+ socket.remotePort);
	socket.on('data', (data) => {
		let json = JSON.parse(data);
		socket.emit(json.eventName, json.data);
	});
	socket.sendEvent = function(eventName, data) {
		let json = {eventName: eventName, data: data};
		socket.write(JSON.stringify(json)); 
	}
	socket.request = async function(name, data) {
		socket.sendEvent(name, data);
		return new Promise(function(resolve, reject) {
			socket.once(name, (response) => {
				resolve(response);
			});
		});
	}

	const connectionTimestamp = Date.now();
	socket.on('connection', (playerData) => {
		const hash = playerData.hash;
		socket.id = hash;
		sockets.set(hash, socket);

		const now = Date.now() + Math.floor(Math.random() * 200);
		playerData['ping'] = Math.floor((now - connectionTimestamp) / 2);
		players.set(hash, new Player(playerData));
		console.log(players);

		socket.sendEvent('connection', getLobbyInfo());
		sendLobbyEvent('enter', hash);
	});

	socket.setTimeout(5000);
	socket.on('timeout', () => {
		console.log('socket timeout');
		players[socket.id].connected = false;
		//clearInterval(pingInterval);
		// Tell the other players about the disconnect
		// Pause the game or lobby
		// Kick player after inactivity
	});

	socket.on('clientPing', () => { 
		socket.sendEvent('clientPing');
		console.log('pong');
	});

	socket.on('leave', () => {
		sendLobbyEvent('leave', socket.id);
		socket.sendEvent('leave');
	});

	socket.on('close', () => {
		console.log('CLOSED: ' + socket.remoteAddress +':'+ socket.remotePort);
		players.delete(socket.id);
		console.log(players);
		clearInterval(pingInterval);
	});

	let pinging = false;
	async function getPing() {
		// This is to make sure players are connected
		// and also to send out everyone's ping for the lobby screen
		if (!pinging) {
			pinging = true;
			const start = Date.now();
			await socket.request('serverPing');
			// const end = Date.now();
			const now = Date.now() + Math.floor(Math.random() * 200);
			pinging = false;
			const player = players.get(socket.id);
			player.ping = Math.floor((now - start) / 2);
			console.log(player.name + ' has ping: ' + player.ping);
			// sendLobbyInfo();
			socket.sendEvent('playerPings', getPlayerPings());
		}
	}
	const pingInterval = setInterval(getPing, 2500);

}).listen(port, host);

function getLobbyInfo() {
	const playerArray = [];
	players.forEach(player => {
		playerArray.push({
			id: player.id,
			name: player.name,
			ping: player.ping,
			connected: player.connected,
			ready: player.ready,
		});
	});
	return playerArray;
}
function sendLobbyEvent(type, id) {
	players.forEach(player => {
		if (player.connected && player.id != id) {
			const socket = sockets.get(player.id);
			const affectedPlayer = players.get(id);
			const json = {type: type, player: affectedPlayer};
			socket.sendEvent('lobbyChange', json);
		}
	});
}
function getPlayerPings() {
	const json = {};
	players.forEach((player) => {
		json[player.id] = player.ping;
	});
	return json;
}

const Player = function(playerData) {
	this.id = playerData.hash;
	this.name = playerData.name;
	this.ping = playerData.ping;
	this.connected = true;
	this.ready = false;
}
console.log('Server listening on ' + host +':'+ port);
