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

		playerData['ping'] = Math.floor((Date.now() - connectionTimestamp) / 2);
		players.set(hash, new Player(playerData));
		console.log(players);

		const lobby = getLobbyInfo();
		socket.sendEvent('connection', lobby);
	});

	socket.setTimeout(3000);
	socket.on('timeout', () => {
		console.log('socket timeout');
		//clearInterval(pingInterval);
		// Tell the other players about the disconnect
		// Pause the game or lobby
		// Kick player after inactivity
	});

	socket.on('clientPing', () => { 
		socket.sendEvent('clientPing');
		console.log('pong');
	});

	socket.on('disconnect', () => {
		players.delete(socket.id);
		console.log(players);
	});

	socket.on('close', function(data) {
		console.log('CLOSED: ' + socket.remoteAddress +':'+ socket.remotePort);
		clearInterval(pingInterval);
	});

	let pinging = false;
	async function getPing() {
		if (!pinging) {
			pinging = true;
			const start = Date.now();
			await socket.request('serverPing');
			const end = Date.now();
			pinging = false;
			const player = players.get(socket.id);
			player.ping = Math.floor((end - start) / 2);
			console.log(player.name + ' has ping: ' + player.ping);
		}
	}
	const pingInterval = setInterval(getPing, 1500);

}).listen(port, host);

function getLobbyInfo() {
	const lobby = [];
	players.forEach(player => {
		lobby.push({
			name: player.name,
			connected: player.connected,
			ready: player.ready,
			ping: player.ping
		});
	});
	return lobby;
}
function sendLobbyInfo() {
	const lobby = getLobbyInfo();
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
	this.ping = playerData.ping;
	this.connected = true;
	this.ready = false;
}
console.log('Server listening on ' + host +':'+ port);
