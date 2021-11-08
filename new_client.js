const keypress = require('keypress');
const controller = new (require('./js/controller.js').Controller);
const display = new(require('./js/display/new_display.js'));

async function updateMenu(command) {
	if (display.waitForAnimation) return;
	const option = controller.menuOption;
	if (command == 'update') {
		display.menu.drawMenu(option);
	} else if (command == 'enter') {
		await display.menu.drawMenuSelection(option);
		controller.onlineOption = 0;
		controller.resetCursorIndex(0);
		const params = [controller.onlineOption, controller.onlineBuffer, controller.cursor, controller.allFieldsFilled];
		display.menu.drawOnline(...params);
		controller.screen = 'online';
	} else if (command == 'quit') {
		display.exit('menu');
		process.exit();
	}
}
async function updateOnline(command) {
	if (command == 'connect') {
		controller.screen = 'connecting';
		const input = controller.onlineBuffer[0].join('');
		const params = input.split(':');
		const host = params[0];
		const port = parseInt(params[1]);
		return;
	} else if (command == 'quit') {
		display.menu.hideCursor();
		display.menu.drawMenu(controller.menuOption);
		controller.screen = 'menu';
		return;
	}
	const params = [controller.onlineOption, controller.onlineBuffer, controller.cursor, controller.allFieldsFilled];
	if (command == 'toggleConnect') params.push(true);
	display.menu.drawOnline(...params);
}
async function updateConnecting(command) {
	if (command == 'cancel') controller.screen = 'online';
}

const screenUpdates = {
	menu: updateMenu,
	online: updateOnline,
	connecting: updateConnecting,
};
let screen = 'menu';

display.init();
display.menu.start(controller.menuOption);

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
});

let rows = process.stdout.rows;
let columns = process.stdout.columns;
let currentlyResizing = false;
let resizeTimer = 0;
let resizeInterval = 17;
setInterval(() => {
	if (rows != process.stdout.rows || columns != process.stdout.columns) {
		display.init();
		display.menu.hideCursor();
		currentlyResizing = true;
		resizeTimer = 0;
		rows = process.stdout.rows;
		columns = process.stdout.columns;
	} else if (currentlyResizing) {
		resizeTimer += resizeInterval;
		if (resizeTimer > 1000) {
			currentlyResizing = false;
			display.menu.toggleCursor(true);
			display.resize(screen);
		}
	}
}, resizeInterval);
