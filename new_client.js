const keypress = require('keypress');
const controller = new (require('./js/controller.js').Controller);
const display = new(require('./js/display/new_display.js'));

async function updateMenu(command) {
	if (controller.screen == 'menu') {
		if (display.animating) return;
		const option = controller.menuOption;
		if (command == 'update') {
			display.menu.drawMenu(option);
		} else if (command == 'enter') {
			await display.menu.drawMenuSelection(option);
			controller.onlineOption = 0;
			const params = [controller.onlineOption, controller.onlineBuffer, controller.cursor, controller.allFieldsFilled];
			display.menu.drawOnline(...params);
			controller.screen = 'online';
		} else if (command == 'quit') {
			display.exit(screen);
			process.exit();
		}
	} else if (controller.screen == 'online') {
		if (command == 'connect') {
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
}

const screenUpdates = {
	menu: updateMenu,
};
let screen = 'menu';
let update = screenUpdates[screen];
function switchTo(name) {
	screen = name;
	update = screenUpdates[name];
}

function render(data, type = 'update') {
	display.update(screen, type, data);
}
display.init();
render(0, 'start');

keypress(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on('keypress', function(chunk, key) {
	const keyPressed = (key == undefined) ? chunk : key.name;
	let params = [keyPressed];
	if (key != undefined) params.push(key.shift, key.ctrl);
	const keyValid = controller.update(...params);
	if (keyValid) {
		const command = controller.handleScreen(controller.screen);
		if (command) {
			update(command);
		}
	}
	// if (controller.esc) {
	// 	display.exit();
	// 	process.exit();
	// }
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
		// process.stdout.cursorTo(0,0);
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
