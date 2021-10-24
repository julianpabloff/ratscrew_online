const net = require('net');
const host = '127.0.0.1';
const port = 6969;

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
	if (controller.onlineStage == 1 && error.code == 'ETIMEDOUT') {
		display.menu.showConnectionError(error.address, error.port.toString());
		display.menu.clearConnectionLoading();
		controller.onlineOption = 0;
		display.menu.drawOnlineDynamic(0, controller.onlineBuffer.length, controller.onlineBuffer);
		controller.onlineStage = 0;
	}
});
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
	if (controller.esc) switchTo('menu');
	const prevOnlineOption = controller.onlineOption;
	controller.handleOnline();
	// display.menu.debugOnlineBuffer(controller.onlineBuffer, controller.textChange);
	if (controller.onlineStage == 0) {
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
			// client.connect(port, host, () => {
			client.connect(port, '123.3.2.3', () => {
				client.log('Sup bitch');
				display.menu.clearConnectionLoading();
				// controller.onlineStage = 2;
			});
		}
	} else if (controller.onlineStage == 1) {
		if (controller.tab) {
			display.menu.clearConnectionLoading();
			client.destroy();
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
		display.menu.setSize();
		display.menu.drawMenuStatic(controller.menuOption);
		// display.menu.drawDynamic(controller.menuOption);
	} else if (name == 'online') {
		if (prevName == 'menu') {
			const wait = setTimeout(() => display.menu.drawOnlineStatic(controller.onlineOption, controller.onlineBuffer, controller.allFieldsFilled), display.menu.animationDuration + 200);
			controller.onlineOption = 0;
		}
		else display.menu.drawOnlineStatic(controller.onlineOption, controller.onlineBuffer, controller.allFieldsFilled);
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
display.menu.drawLogo();
startScreen('menu');

let keypress = require('keypress');
keypress(process.stdin);
process.stdin.setRawMode(true);

process.stdin.on('keypress', function(chunk, key) {
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

function redrawScreen(name) {
	display.init();
	display.resize();
	display.menu.setSize();
	if (name == 'online') {
		display.menu.drawLogo();
		display.menu.clearCursor();
		// display.menu.clearOnline(controller.onlineOption, controller.onlineBuffer);
	}
	startScreen(name, name);
}

let rows = process.stdout.rows;
let columns = process.stdout.columns;
setInterval(() => {
	if (rows != process.stdout.rows || columns != process.stdout.columns) {
		redrawScreen(screen);
		// updateStatic();
		// updateDynamic();
		rows = process.stdout.rows;
		columns = process.stdout.columns;
		menuChanged = true;
	}
}, 17);
