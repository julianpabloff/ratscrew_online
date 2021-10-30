const keypress = require('keypress');
const controller = new (require('./js/controller.js').Controller);
const display = new(require('./js/display/new_display.js'));

const screenData = {};
function updateDisplayData() {
	let data;
	if (screen == 'menu') data = { option: controller.menuOption };
	screenData[screen] = data;
}
let screen = 'menu';
function start() {
	const data = screenData[screen];
	display.start(screen, data);
}
function render() {
	const data = screenData[screen];
	display.update(screen, data);
}

display.init();
updateDisplayData();
start();
keypress(process.stdin);
process.stdin.setRawMode(true);

process.stdin.on('keypress', function(chunk, key) {
	const keyPressed = (key == undefined) ? chunk : key.name;
	let params = [keyPressed];
	if (key != undefined) params.push(key.shift, key.ctrl);
	const keyValid = controller.update(...params);
	if (controller.esc && screen == 'menu') {
		display.exit();
		process.exit();
	}
	if (keyValid) {
		controller.handleScreen(screen);
		updateDisplayData();
		render();
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
