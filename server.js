const net = require('net');

// const host = '127.0.0.1';
const host = '192.168.0.106';
const port = 6969;

const players = new Map();
const lobby = {};

net.createServer((socket) => {
	console.log('CONNECTED: ' + socket.remoteAddress +':'+ socket.remotePort);

	function sendEvent(eventName, data) {
		let json = {eventName: eventName, data: data};
		socket.write(JSON.stringify(json)); 
	}

	socket.on('data', (data) => {
		let json = JSON.parse(data);
		socket.emit(json.eventName, json.data);
	});

	socket.on('connection', (playerData) => {
		players.set(playerData.hash, new Player(playerData));
		console.log(players);
		let playerNameList = [];
		for (let player of players.values()) playerNameList.push(player.name);
		sendEvent('connection', {players: playerNameList});
	});

	socket.on('ping', () => { sendEvent('ping'); });

	socket.on('close', function(data) {
		console.log('CLOSED: ' + socket.remoteAddress +' '+ socket.remotePort);
	});
}).listen(port, host);

const Player = function(playerData) {
	this.hand = [];
	this.ready = false;
	this.name = playerData.name;
}
console.log('Server listening on ' + host +':'+ port);
