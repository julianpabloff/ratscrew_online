const BufferModule = require('./buffer.js');
const NewMenuDisplay = require('./new_menu_display.js');

const NewDisplay = function() {
	const stdout = process.stdout;
	this.draw = function(string, x, y) {
		stdout.cursorTo(x, y);
		stdout.write(string);
	}
	this.clear = () => stdout.write('\x1b[2J');
	this.init = function() {
		this.clear();
		stdout.write('\x1b[?25l');
	}

	// Dimensions
	this.setSize = function() {
		rows = stdout.rows;
		columns = stdout.columns;
	}
	let rows, columns;
	this.setSize();

	this.centerWidth = (width) => { return Math.floor(columns/2 - width/2); }
	this.centerHeight = (height) => { return Math.floor(rows/2 - height/2); }

	// Buffers
	this.buffer = new BufferModule.BufferManager();
	this.addBuffer = function(x, y, width, height, screen) {
		const displayBuffer = new BufferModule.DisplayBuffer(x, y, width, height, this.buffer, screen);
		this.buffer.addBuffer(displayBuffer, screen);
		return displayBuffer;
	}

	// Colors
	const colors = {
		fg : { black:'\x1b[30m', red:'\x1b[31m', green:'\x1b[32m', magenta:'\x1b[35m', blue:'\x1b[34m', cyan:'\x1b[36m', white:'\x1b[37m', reset:'\x1b[0m' },
		bg : { black:'\x1b[40m', red:'\x1b[41m', green:'\x1b[42m', magenta:'\x1b[45m', blue:'\x1b[44m', cyan:'\x1b[46m', white:'\x1b[47m', reset:'\x1b[0m' },
	};
	this.setFg = function(colorName) { 
		stdout.write(colors.fg[colorName]);
	}
	this.setBg = function(colorName) { 
		stdout.write(colors.bg[colorName]);
	}
	this.setColor = function(fg, bg) {
		this.setFg(fg); this.setBg(bg);
	}

	this.menu = new NewMenuDisplay(this);
	this.start = function(screen, data) {
		this[screen].start(data);
	}
	this.update = function(screen, data) {
		this[screen].update(data);
	}
	this.exit = function() {
		stdout.write('\x1b[?25h\x1b[0m\x1b[2J');
		stdout.cursorTo(0,0);
	}
}

module.exports = NewDisplay;
