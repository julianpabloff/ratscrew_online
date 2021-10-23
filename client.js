var net = require('net');
var host = '127.0.0.1';
var port = 6969;

/*
var client = new net.Socket();
client.connect(port, host, function() {
	console.log('CONNECTED TO: ' + host + ':' + port);
	// Write a message to the socket as soon as the client is connected, the server will receive it as message from the client
	client.write('I am Chuck Norris!');
});

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
	if (prevOnlineOption != controller.onlineOption)
		display.menu.drawOnlineDynamic(controller.onlineOption, prevOnlineOption, controller.onlineBuffer);
	if (controller.textChange != null) {
		display.menu.drawOnlineBuffer(controller.textChange);
		if (prevAllFieldsFilled != controller.allFieldsFilled)
			display.menu.toggleConnectButton(controller.allFieldsFilled);
		prevAllFieldsFilled = controller.allFieldsFilled;
	} else if (controller.enter && controller.onlineOption == controller.onlineBuffer.length && controller.allFieldsFilled) {
		display.menu.drawOnlineSelection(controller.onlineOption);
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
	else if (name == 'game') display.game.clear(game.piles, controller.buffer);//display.init(); //display.clearGameBoard();
	else if (name == 'settings') display.settings.clear();
}

function startScreen(name) {
	if (name == 'menu') {
		display.menu.setSize();
		display.menu.drawLogo();
		display.menu.drawMenuStatic(controller.menuOption);
		// display.menu.drawDynamic(controller.menuOption);
	} else if (name == 'online') {
		const wait = setTimeout(() => display.menu.drawOnlineStatic(controller.onlineOption, controller.onlineBuffer), display.menu.animationDuration + 200);
	} else if (name == 'game') {
	}
}

function switchTo(name) {
	clearScreen(screen);
	screen = name;
	update = screenUpdates[name];
	startScreen(name);
}

display.init();
startScreen('menu');

let keypress = require('keypress');
keypress(process.stdin);
process.stdin.setRawMode(true);

process.stdin.on('keypress', function(chunk, key) {
	let keyPressed = (key == undefined) ? chunk : key.name;
	controller.update(keyPressed, (key == undefined) ? false : key.shift);
    update();
	// if (game.players.length > 0) controller.updatePlayerControls(game.players, keyPressed);
	// updateDynamic();
	if (controller.esc) {
		display.exit();
		process.exit();
	}
});

function redrawScreen(name) {
	display.init();
	display.resize();
	display.menu.setSize();
	if (name == 'online') {
		display.menu.drawLogo();
	}
	startScreen(name);
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
