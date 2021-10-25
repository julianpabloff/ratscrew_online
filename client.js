const net = require('net');
// const host = '127.0.0.1';
// const port = 6969;

const client = new net.Socket();
client.log = function(text) {
	const obj = {
		text: text,
		time: Date.now()
	};
	client.write(JSON.stringify(obj));
}
client.on('error', function(error) {
	// if trying to connect to server lobby
	if (controller.onlineStage == 1) {
		let message;
		switch(error.code) {
			case 'ETIMEDOUT': message = 'Connection timed out'; break;
			case 'ENOTFOUND' : message = 'Server not found'; break;
			case 'ECONNREFUSED' : message = 'Connection refused'; break;
			case 'ENOENT' : message = 'Invalid address'; break;
			default: message = 'Something else happened bro'; break;
		}
		// display.menu.showConnectionError(error.address, error.port.toString());
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
/*
// Add a 'data' event handler for the client socket
// data is what the server sent to this socket
client.on('data', function(data) {
	console.log('DATA: ' + data);
	// Close the client socket completely
	client.destroy();
});

// Add a 'close' event handler for the client socket
client.on('close', function() {
	console.log('Connection closed');
});
*/

const display = new (require('./js/display/display.js'));
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
	const prevMenuOption = controller.menuOption;
	controller.handleMenu();
	if (prevMenuOption != controller.menuOption)
		display.menu.drawMenuDynamic(controller.menuOption, controller.prevMenuOption);
}

let prevAllFieldsFilled = false;
function updateOnline() {
	const prevOnlineOption = controller.onlineOption;
	controller.handleOnline();
	// display.menu.debugOnlineBuffer(controller.onlineBuffer, controller.textChange);
	if (controller.onlineStage == 0) {
		if (controller.esc) switchTo('menu');
		// Moving through menu
		if (prevOnlineOption != controller.onlineOption)
			display.menu.drawOnlineDynamic(controller.onlineOption, prevOnlineOption, controller.onlineBuffer);
		// Text update
		if (controller.textChange != null) {
			display.menu.drawOnlineBuffer(controller.textChange);
			// Form validation for connect button
			if (prevAllFieldsFilled != controller.allFieldsFilled)
				display.menu.toggleConnectButton(controller.allFieldsFilled, true);
			prevAllFieldsFilled = controller.allFieldsFilled;
		// Connect button pressed
		} else if (controller.enter && controller.onlineOption == controller.onlineBuffer.length && controller.allFieldsFilled) {
			display.menu.drawOnlineSelection(controller.onlineOption);
			display.menu.drawConnectionLoading();
			display.menu.hideConnectionError();
			controller.onlineStage = 1;
			/*
			setTimeout(() => {
				if (controller.onlineStage == 1) {
					display.menu.toggleConnectingMessage(0, true);
					display.menu.connectionMessageStage = 0;
				}
			}, 1000);
			setTimeout(() => {
				if (controller.onlineStage == 1) {
					display.menu.toggleConnectingMessage(1, true);
					display.menu.connectionMessageStage = 1;
				}
			}, 3000);
			*/
			// client.connect(port, host, () => {
			const input = controller.onlineBuffer[0].join('');
			const params = input.split(':');
			const host = params[0];
			const port = parseInt(params[1]);
			if (port >= 65536 || port == 0) {
				displayConnectionError('Port should be in between 1 and 65535');
				return;
			}
			client.connect(parseInt(params[1]), params[0], () => {
				client.log('Sup bitch');
				display.menu.clearConnectionLoading(false);
				controller.onlineStage = 2;
			});
		}
	} else if (controller.onlineStage == 2) {
		if (controller.esc) {
			controller.onlineStage = 0;
			client.destroy();
		}
	} else if (client.connecting) {
		/*
		if (controller.esc) {
			display.menu.clearConnectionLoading(false);
			display.menu.toggleConnectingMessage(display.menu.connectionMessageStage, false);
			controller.onlineOption = 2;
			display.menu.drawOnlineDynamic(2, 0, controller.onlineBuffer);
			controller.onlineStage = 0;
			client.destroy();
		}
		*/
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
		display.menu.setSize();
		display.menu.drawLogo();
		display.menu.drawMenuStatic(controller.menuOption);
		// display.menu.drawDynamic(controller.menuOption);
	} else if (name == 'online') {
		if (prevName == 'menu') {
			controller.onlineOption = 0;
			const wait = setTimeout(() => {
				display.menu.drawOnlineStatic(controller.onlineOption, controller.onlineBuffer, controller.allFieldsFilled)
			}, display.menu.animationDuration + 200);
		} else if (prevName == 'online') {
			display.menu.drawLogo();
			if (controller.onlineStage == 1) display.menu.drawConnectionLoading();
			display.menu.drawOnlineStatic(controller.onlineOption, controller.onlineBuffer, (controller.allFieldsFilled && controller.onlineStage == 0));
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

display.init();
startScreen('menu');

let keypress = require('keypress');
keypress(process.stdin);
process.stdin.setRawMode(true);

process.stdin.on('keypress', function(chunk, key) {
	if (currentlyResizing) return;
	let keyPressed = (key == undefined) ? chunk : key.name;
	controller.update(keyPressed, (key == undefined) ? false : key.shift);
	if (controller.esc && screen == 'menu') {
		client.destroy();
		display.exit();
		process.exit();
	}
    update();
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
