const net = require('net');
const os = require('os');
const game = require('./js/game.js');

// const host = '192.168.0.106';
let host;
const port = 6969;
const nets = os.networkInterfaces();
for (const name of Object.keys(nets))
	for (const net of nets[name])
		if (net.family == 'IPv4' && !net.internal)
			host = net.address;

const players = new Map();
const sockets = new Map();

const server = net.createServer((socket) => {
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
	socket.on('connection', playerData => {
		const hash = playerData.hash;
		socket.id = hash;
		sockets.set(hash, socket);

		const now = Date.now() + Math.floor(Math.random() * 200);
		playerData['ping'] = Math.floor((now - connectionTimestamp) / 2);
		players.set(hash, new Player(playerData));
		console.log(players);

		socket.sendEvent('connection', getLobbyInfo());
		broadcastEvent('enter', hash);
	});

	socket.on('broadcast', event => {
		const type = event.type;
		const data = event.data;
		switch(type) {
			case 'ready':
				const player = players.get(socket.id);
				player.ready = data;
				console.log(player.name + ' is ' + (data ? '' : 'not ') + 'ready');
				break;
		}
		broadcastEvent(type, socket.id);
	});

	socket.on('close', () => {
		console.log('CLOSED: ' + socket.remoteAddress +':'+ socket.remotePort);
		players.delete(socket.id);
		console.log(players);
		clearInterval(pingInterval);
	});

	socket.on('error', error => console.log);

	let pinging = false;
	let connected = true;
	socket.getPing = async function(sendOutPing = true) {
		// This is to make sure players are connected
		// and also to send out everyone's ping for the lobby screen
		const player = players.get(socket.id);
		if (!pinging) {
			pinging = true;
			const start = Date.now();
			await socket.request('serverPing');
			// const end = Date.now();
			const end = Date.now() + Math.floor(Math.random() * 200);
			pinging = false;
			connected = true;
			player.ping = Math.floor((end - start) / 2);
			player.connected = true;
			if (sendOutPing) socket.sendEvent('playerPings', getPlayerPings());
			return Promise.resolve();
		} else {
			player.connected = false;
			if (connected) broadcastEvent('disconnect', socket.id);
			connected = false;
			return Promise.reject('couldn\'t get ping');
		}
	}
	const pingInterval = setInterval(() => socket.getPing().catch(()=>{}), 2000);

}).listen(port, host);
server.maxConnections = 4;

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
function broadcastEvent(type, id) {
	players.forEach(player => {
		const affectedPlayer = players.get(id);
		if (player.id != id) {
			const socket = sockets.get(player.id);
			socket.getPing(false).then(() => {
				const json = {type: type, data: affectedPlayer};
				socket.sendEvent('broadcast', json);
			}, () => {});
		}
	});
}
function getPlayerPings() {
	const json = {};
	players.forEach((player) => {
		json[player.id] = {
			ping: player.ping,
			connected: player.connected
		};
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
