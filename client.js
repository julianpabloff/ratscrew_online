const net = require('net');
const crypto = require('crypto');

// Socket
const socket = new net.Socket();
function sendEvent(eventName, data) {
	let json = {eventName: eventName, data: data};
	serverResponding = false;
	socket.write(JSON.stringify(json));
}
async function request(name, data) {
	sendEvent(name, data);
	return new Promise(function(resolve, reject) {
		socket.once(name, (response) => {
			resolve(response);
		});
	});
}
let serverResponding = false;
socket.on('data', function(data) {
	serverResponding = true;
	let json = JSON.parse(data);
	socket.emit(json.eventName, json.data);
});

socket.on('error', function(error) {
	// if trying to connect to server lobby
	if (controller.onlineStage == 1) {
		/*
		let message;
		switch(error.code) {
			case 'ETIMEDOUT': message = 'Connection timed out'; break;
			case 'ENOTFOUND' : message = 'Server not found'; break;
			case 'ECONNREFUSED' : message = 'Connection refused'; break;
			case 'ENOENT' : message = 'Invalid address'; break;
			default: message = 'Something else happened bro'; break;
		}
		*/
		const message = 'Connection error (' + error.code + ')';
		display.menu.hideConnectingMessage(display.menu.connectionMessageStage);
		displayConnectionError(message);
	}
	// process.stdout.cursorTo(1,1);
	// console.log(error);
});
function displayConnectionError(message) {
	display.menu.showConnectionError(message);
	display.menu.clearConnectionLoading(false);
	controller.onlineOption = 0;
	display.menu.cancelOnlineSelection();
	display.menu.drawOnlineDynamic(0, controller.onlineBuffer.length, controller.onlineBuffer);
	controller.onlineStage = 0;
}

let connectionCancelled = false;
let pendingConnections = 0;
let playerName = '';
const hash = crypto.randomBytes(32).toString('hex');
socket.on('connect', () => {
	pendingConnections--;
	process.stdout.cursorTo(4, 50);
	if (connectionCancelled) {
		socket.destroy();
		if (pendingConnections == 0) connectionCancelled = false;
	}
	else if (screen == 'online') {
		const playerData = {
			name: playerName,
			hash: hash
		}
		// sendEvent('connection', playerData);
		request('connection', playerData).then(lobbyData => {
			connected = true;
			processLobbyData(lobbyData);
			display.menu.clearConnectionLoading(true);
			display.menu.hideConnectingMessage(display.menu.connectionMessageStage);
			display.menu.drawLobbyStatic(lobby);
			controller.onlineStage = 2;
		});
	}
});

const lobby = new Map();
function processLobbyData(lobbyData) {
	for (let player of lobbyData) {
		// const buffer = Buffer.from(player.id);
		// player.you = (buffer.compare(hash) == 0);
		player.you = (player.id == hash);
		lobby.set(player.id, player);
	}
}
socket.on('lobbyEvent', event => {
	// Lobby commands
	// enter, leave, disconnect, reconnect, ready
	const player = event.player;
	const type = event.type;
	if (type == 'enter') {
		player.you = false;
		lobby.set(player.id, player);
		display.menu.addPlayerToLobby(player, lobby.size - 1);
	} else if (type == 'leave') {
		display.menu.removePlayerFromLobby(lobby, player.id);
		lobby.delete(player.id);
	} else if (type == 'disconnect') {
		lobby.get(player.id).connected = player.connected;
	}
});
socket.on('serverPing', () => {
	connected = true;
	lobby.get(hash).connected = true;
	process.stdout.cursorTo(1, 20);
	sendEvent('serverPing');
});
socket.on('playerPings', connectionData => {
	lobby.forEach(player => {
		const playerConnectionData = connectionData[player.id];
		player.ping = playerConnectionData.ping;
		player.connected = playerConnectionData.connected;
	});
	if (screen == 'online')
		display.menu.drawLobbyConnectionInfo(lobby);
});
let connected = false;
socket.setTimeout(3000);
socket.on('timeout', () => {
	if (connected) {
		process.stdout.cursorTo(1, 20);
		lobby.get(hash).connected = false;
		console.log('timed out');
		connected = false;
	}
});
/*
socket.on('close', function() {
	console.log('Connection closed');
});
*/

// Server Functions
let pinging = false;
let ping = 0;
async function getPing() {
	if (pinging) {
		return ping;
	}
	pinging = true;
	const start = Date.now();
	await request('clientPing');
	const end = Date.now();
	pinging = false;
	return Math.floor((end - start) / 2);
}

const display = new (require('./js/display/display.js'));
display.init();
	const MenuDisplay = require('./js/display/menu_display.js');
	display.menu = new MenuDisplay(display);
const Controller = require('./js/controller.js');
const controller = new Controller.Controller;
const game = new(require('./js/game.js'));

function updateMenu() {
	if (controller.enter && controller.menuOption == 1) {
		switchTo('online');
		return;
	}
	controller.handleMenu();
	if (controller.prevMenuOption != controller.menuOption)
		display.menu.drawMenuDynamic(controller.menuOption, controller.prevMenuOption);
}

let prevAllFieldsFilled = false;
async function updateOnline() {
	const prevOnlineOption = controller.onlineOption;
	controller.handleOnline();
	// display.menu.debugOnlineBuffer(controller.onlineBuffer, controller.textChange);
	if (controller.onlineStage == 0) {
		if (controller.esc) switchTo('menu');
		// Moving through menu
		else if (prevOnlineOption != controller.onlineOption) {
			if (display.menu.isAnimating()) {
				controller.onlineOption = prevOnlineOption;
				return;
			}
			display.menu.drawOnlineDynamic(controller.onlineOption, prevOnlineOption, controller.onlineBuffer);
		// Text update
		} else if (controller.textChange != null) {
			display.menu.drawOnlineBuffer(controller.textChange);
			// Form validation for connect button
			if (prevAllFieldsFilled != controller.allFieldsFilled)
				display.menu.toggleConnectButton(controller.allFieldsFilled, true);
			prevAllFieldsFilled = controller.allFieldsFilled;
		// Connect button pressed
		} else if (controller.enter && controller.onlineOption == controller.onlineBuffer.length && controller.allFieldsFilled) {
			controller.onlineStage = 1;
			const input = controller.onlineBuffer[0].join('');
			const params = input.split(':');
			// const host = params[0];
			// const port = parseInt(params[1]);
			const host = '192.168.0.106';
			const port = 6969;
			if (port >= 65536 || port == 0) {
				displayConnectionError('Port should be in between 1 and 65535');
				return;
			}
			playerName = controller.onlineBuffer[1].join('');
			// socket.connect(port, host); 
			pendingConnections++;
			const delayConnection = setTimeout(() => {
				socket.connect(port, host);
			}, 1300);
			display.menu.drawOnlineSelection(controller.onlineOption);
			display.menu.drawConnectionLoading();
			display.menu.hideConnectionError();
			display.menu.showConnectingMessages(1000, 3000);
		}
	} else if (controller.onlineStage == 1) {
		if (controller.esc) {
			connectionCancelled = true;
			display.menu.clearConnectionLoading(false);
			display.menu.hideConnectingMessage(display.menu.connectionMessageStage);
			controller.onlineOption = 2;
			// display.menu.drawOnlineDynamic(2, 0, controller.onlineBuffer);
			display.menu.drawAsync('drawOnlineDynamic', [2, 0, controller.onlineBuffer]);
			controller.onlineStage = 0;
			socket.destroy();
		}
	} else if (controller.onlineStage == 2) {
		if (controller.space) {
			display.menu.debugLobby(lobby);
		}
		if (controller.esc) {
			controller.onlineStage = 0;
			controller.onlineOption = 0;
			display.menu.clearLobby(lobby);
			display.menu.drawOnlineDynamic(0, 2, controller.onlineBuffer);
			lobby.clear();
			// request('leave').then(() => {
				socket.destroy();
			// });
		} else if (controller.tab) {
			getPing().then((ping) => {
				process.stdout.cursorTo(1, 10);
				console.log(ping);
			});
		}
	}
}

let screenUpdates = {
    menu: updateMenu,
	online: updateOnline,
};

let screen = 'menu';
let update = screenUpdates[screen];

function clearScreen(name) {
	if (name == 'menu') display.menu.drawMenuSelection(controller.menuOption);
	else if (name == 'online') display.menu.clearOnline(controller.onlineOption, controller.onlineBuffer);
	else if (name == 'game') display.game.clear(game.piles, controller.buffer);//display.init(); //display.clearGameBoard();
	else if (name == 'settings') display.settings.clear();
}

function startScreen(name, prevName = 'none') {
	if (name == 'menu') {
		display.menu.drawLogo();
		display.menu.drawMenuStatic(controller.menuOption);
		// display.menu.setSize();
		// display.menu.drawLogo();
		// display.menu.drawMenuStatic(controller.menuOption);
	} else if (name == 'online') {
		if (prevName == 'menu') {
			prevAllFieldsFilled = true;
			controller.onlineOption = 0;
			controller.onlineBuffer = [
				['s', 'e', 'r', 'v', 'e', 'r', ':', '4', '2', '0'],
				['j', 'u', 'l', 'i', 'a', 'n', Math.floor(Math.random() * 10).toString(), Math.floor(Math.random() * 10).toString()]
			];
			controller.allFieldsFilled = true;
			const params = [controller.onlineOption, controller.onlineBuffer, controller.allFieldsFilled];
			display.menu.drawAsync('drawOnlineStatic', params);
		} else if (prevName == 'online') {
			display.menu.drawLogo();
			if (controller.onlineStage == 1) display.menu.drawConnectionLoading();
			if (controller.onlineStage < 2) display.menu.drawOnlineStatic(controller.onlineOption, controller.onlineBuffer, (controller.allFieldsFilled && controller.onlineStage == 0));
			else display.menu.drawLobbyStatic(lobby);
		}
	} else if (name == 'game') {
	}
}

function switchTo(name) {
	clearScreen(screen);
	startScreen(name, screen);
	screen = name;
	update = screenUpdates[name];
}

startScreen('menu');

let keypress = require('keypress');
keypress(process.stdin);
process.stdin.setRawMode(true);

process.stdin.on('keypress', function(chunk, key) {
	if (currentlyResizing) return;
	const keyPressed = (key == undefined) ? chunk : key.name;
	let params = [keyPressed];
	if (key != undefined) params.push(key.shift, key.ctrl);
	const keyValid = controller.update(...params);
	if (controller.esc && screen == 'menu') {
		socket.destroy();
		display.exit();
		process.exit();
	}
    if (keyValid) update();
	// if (game.players.length > 0) controller.updatePlayerControls(game.players, keyPressed);
	// updateDynamic();
});

let rows = process.stdout.rows;
let columns = process.stdout.columns;
let currentlyResizing = false;
let resizeTimer = 0;
let resizeInterval = 17;
setInterval(() => {
	const windowChanged = rows != process.stdout.rows || columns != process.stdout.columns;
	if (windowChanged) {
		// if (!currentlyResizing) display.init();
		display.init();
		if (screen == 'online') {
			display.menu.clearCursor();
		}
		process.stdout.cursorTo(0,0);
		currentlyResizing = true;
		resizeTimer = 0;
		rows = process.stdout.rows;
		columns = process.stdout.columns;
	} else if (currentlyResizing) {
		resizeTimer += resizeInterval;
		if (resizeTimer > 1000) {
			currentlyResizing = false;
			display.resize();
			display.menu.setSize();
			startScreen(screen, screen);
		}
	}
}, resizeInterval);
