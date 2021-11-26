const net = require('net');
const crypto = require('crypto');
const keypress = require('keypress');
const controller = new (require('./js/controller.js').Controller);
const display = new (require('./js/display/display.js'));

// Server interaction
const socket = new net.Socket();
let serverResponding = false;
function sendEvent(name, data) {
	const json = {eventName: name, data: data};
	serverResponding = false;
	socket.write(JSON.stringify(json));
}
function request(name, data) {
	sendEvent(name, data);
	return new Promise(resolve => {
		socket.once(name, response => resolve(response));
	});
}
const broadcast = (type, data) => sendEvent('broadcast', {type: type, data: data});

socket.on('data', data => {
	serverResponding = true;
	const json = JSON.parse(data);
	socket.emit(json.eventName, json.data);
});

socket.on('error', error => {
	if (controller.screen == 'connecting') {
		let message;
		switch(error.code) {
			case 'ETIMEDOUT': message = 'Connection timed out'; break;
			case 'ENOTFOUND' : message = 'Server not found'; break;
			case 'ECONNREFUSED' : message = 'Connection refused'; break;
			case 'ENOENT' : message = 'Invalid address'; break;
			case 'ECONNRESET' : message = 'Server full'; break;
			default: message = 'Connection error (' + error.code + ')'; break;
		}
		display.menu.stopConnectionLoading('error');
		controller.resetForm();
		display.menu.drawOnline(controller.online, false, message);
		controller.screen = 'online';
	}
});
let playerName;
let pendingConnections = 0;
let connectionCancelled = false;
let connected = false;
const hash = crypto.randomBytes(32).toString('hex');
socket.on('connect', () => {
	pendingConnections--;
	if (connectionCancelled) {
		socket.destroy();
		connectionCancelled = (pendingConnections != 0);
	} else if (controller.screen == 'connecting') {
		const playerData = {
			name: playerName,
			hash: hash
		};
		request('connection', playerData).then(lobbyData => {
			connected = true;
			processLobbyData(lobbyData);
			display.menu.stopConnectionLoading('connection');
			display.menu.drawLobby(lobby);
			controller.screen = 'lobby';
		});
	}
});
socket.on('serverPing', () => {
	connected = true;
	lobby.get(hash).connected = true;
	sendEvent('serverPing');
});
socket.on('playerPings', connectionData => {
	lobby.forEach(player => {
		const playerConnectionData = connectionData[player.id];
		if (playerConnectionData == undefined) lobby.delete(player.id);
		else {
			player.ping = playerConnectionData.ping;
			player.connected = playerConnectionData.connected;
		}
	});
	if (controller.screen == 'lobby')
		display.menu.drawLobby(lobby);
});

socket.on('broadcast', event => {
	const player = event.data;
	switch(event.type) {
		case 'enter':
			player.you = false;
			lobby.set(player.id, player);
			break;
		case 'ready':
			lobby.get(player.id).ready = player.ready;
			const youReady = lobby.get(hash).ready;
			if (everyoneReady()) startCountdown();
			else if (youReady) {
				stopCountdown();
				display.menu.startWaiting();
			}
			break;
		case 'disconnect': lobby.get(player.id).connected = player.connected; break;
		case 'leave': lobby.delete(player.id); break;
	}
	display.menu.drawLobby(lobby);
});

socket.setTimeout(3000);
socket.on('timeout', () => {
	if (connected) {
		display.debug('Socket timed out');
		lobby.get(hash).connected = false;
		connected = false;
	}
});

// Lobby
const lobby = new Map();
function processLobbyData(lobbyData) {
	for (const player of lobbyData) {
		player.you = (player.id == hash);
		lobby.set(player.id, player);
	}
}
function everyoneReady(includeYou = true) {
	if (lobby.size < 2) return false;
	for (const player of lobby.values()) {
		let check = !player.ready;
		if (!includeYou) check = check && !player.you;
		if (check) return false;
	}
	return true;
}
let countdownTimeouts = [];
function startCountdown() {
	display.menu.stopWaiting();
	display.menu.startCountdown();
	countdownTimeouts.push(setTimeout(() => {
		display.menu.clear();
		display.menu.dissolveLogo();
		controller.screen = 'game';
	}, 5000));
	countdownTimeouts.push(setTimeout(() => {
		// display.game.drawCard();
	}, 6000));
}
function stopCountdown() {
	display.menu.stopCountdown();
	for (const timeout of countdownTimeouts) clearTimeout(timeout);
	countdownTimeouts = [];
}

// Updates
async function updateMenu(command) {
	if (display.waiting) return;
	const option = controller.menuOption;
	if (command == 'update') {
		display.menu.drawMenu(option);
	} else if (command == 'enter') {
		await display.menu.drawMenuSelection(option);
		controller.resetForm();
		display.menu.drawOnline(controller.online);
		controller.screen = 'online';
	} else if (command == 'quit') {
		display.exit('menu');
		process.exit();
	}
}
function updateOnline(command) {
	if (command == 'connect') {
		const input = controller.online.buffer[0].join('');
		const params = input.split(':');
		// const host = params[0];
		// const port = parseInt(params[1]);
		const host = '192.168.0.106';
		const port = 6969;
		if (port >= 65536 || port == 0) {
			controller.resetForm();
			display.menu.drawOnline(controller.online, false, 'Invalid port');
			return;
		}
		playerName = controller.online.buffer[1].join('');
		controller.screen = 'connecting';
		display.menu.startConnectionLoading();
		pendingConnections++;
		const delayConnection = setTimeout(() => {
			socket.connect(port, host);
		}, 300);
		return;
	} else if (command == 'quit') {
		display.menu.hideCursor();
		display.menu.drawMenu(controller.menuOption);
		controller.screen = 'menu';
		return;
	}
	display.menu.drawOnline(controller.online, (command == 'toggleConnect'));
}
function updateConnecting(command) {
	if (display.waiting) return;
	if (command == 'cancel') {
		connectionCancelled = true;
		controller.screen = 'online';
		display.menu.stopConnectionLoading('cancel');
		socket.destroy();
	}
}
function updateLobby(command) {
	const you = lobby.get(hash);
	const prevReady = you.ready;
	if (command == 'escape') {
		if (you.ready) {
			you.ready = false;
			if (everyoneReady(false)) stopCountdown();
			else display.menu.stopWaiting();
		} else {
			lobby.clear();
			broadcast('leave');
			socket.destroy();
			controller.screen = 'online';
			display.menu.clearLobby();
			display.menu.drawOnline(controller.online);
		}
	} else if (command == 'ready' && !you.ready) {
		you.ready = true;
		if (everyoneReady(false)) startCountdown();
		else display.menu.startWaiting();
	}
	if (you.ready != prevReady) {
		// sendEvent('ready', you.ready);
		broadcast('ready', you.ready);
		display.menu.drawLobby(lobby);
	}
}
function updateGame(command) {
	if (command == 'escape') {
		socket.destroy();
		process.exit();
	}
}

const screenUpdates = {
	menu: updateMenu,
	online: updateOnline,
	connecting: updateConnecting,
	lobby: updateLobby,
	game: updateGame
};
let screen = 'menu';

display.init();
display.menu.start(controller.menuOption);
// display.game.drawCardArea();
// display.game.drawCard(8, 'c', 0, 0);

keypress(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on('keypress', function(chunk, key) {
	const keyPressed = (key == undefined) ? chunk : key.name;
	let params = [keyPressed];
	if (key != undefined) params.push(key.shift, key.ctrl);
	const keyValid = controller.update(...params);
	if (keyValid) {
		const command = controller.handleScreen(controller.screen);
		if (command) screenUpdates[controller.screen](command);
	}
	/*
	const value = Math.floor(Math.random() * 14) + 1;
	const suits = ['h', 'c', 'd', 's'];
	const suit = suits[Math.floor(Math.random() * suits.length)];
	const start = Date.now();
	display.game.drawCard(value, suit, 0, 0);
	// process.stdout.cursorTo(0,0);
	const delta = Date.now() - start;
	display.debug(delta.toString() + 'ms  ');
	*/
});

let resizeCountdown;
process.stdout.on('resize', () => {
	display.init();
	display.menu.hideCursor();
	clearTimeout(resizeCountdown);
	resizeCountdown = setTimeout(() => {
			display.menu.toggleCursor(true);
			display.resize(screen);
	}, 1000);
});
