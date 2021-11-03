const keypress = require('keypress');
const controller = new (require('./js/controller.js').Controller);
const display = new(require('./js/display/new_display.js'));

async function updateMenu(command) {
	const option = controller.menuOption;
	if (command == 'enter') {
		await display.menu.drawMenuSelection(option);
		display.menu.drawOnline(0);
	} else if (command == 'quit') {
		display.menu.exit();
		display.exit();
		process.exit();
	} else {
		display.menu.drawMenu(option);
	}
}

const screenUpdates = {
	menu: updateMenu
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
	if (controller.esc && screen == 'menu') {
		display.exit();
		process.exit();
	}
	if (display.animating) return;
	const keyValid = controller.update(...params);
	if (keyValid) {
		const command = controller.handleScreen(screen);
		if (command != null) {
			update(command);
		}
	}
});

let rows = process.stdout.rows;
let columns = process.stdout.columns;
let currentlyResizing = false;
let resizeTimer = 0;
let resizeInterval = 17;
/*
setInterval(() => {
	const windowChanged = rows != process.stdout.rows || columns != process.stdout.columns;
	if (windowChanged) {
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
*/
