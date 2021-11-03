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
		this.buffer.setFg(colorName);
	}
	this.setBg = function(colorName) { 
		stdout.write(colors.bg[colorName]);
		this.buffer.setBg(colorName);
	}
	this.setColor = function(fg, bg) {
		this.setFg(fg); this.setBg(bg);
		this.buffer.setColor(fg, bg);
	}

	// Screens
	this.menu = new NewMenuDisplay(this);
	this.update = function(screen, type, data) {
		this[screen][type](data);
	}

	this.exit = function() {
		// stdout.write('\x1b[?25h\x1b[0m\x1b[2J');
		stdout.write('\x1b[?25h\x1b[0m');
		stdout.cursorTo(0,0);
	}

	// Animations
	this.animating = false;
	this.dissolve = function(width, x, y, duration, content = false, color = false) {
		const positions = new Uint8Array(width);
		const sequence = new Uint8Array(width);
		let sequenceIndex = 0;
		for (let i = width; i >= 1; i--) {
			const random = Math.floor(Math.random() * i) + 1;
			let count = 0;
			for (let j = 0; j < width; j++) {
				if (positions[j] == 0) count++;
				if (count == random) {
					positions[j] = 1;
					sequence[sequenceIndex] = j;
					sequenceIndex++;
					break;
				}
			}
		}
		let increment = 0;
		const display = this;
		function dissolveHelper() {
			if (increment == width) {
				clearInterval(dissolveInterval);
			} else {
				const char = content ? content[sequence[increment]] : ' ';
				if (color) display.setFg(color);
				display.draw(char, x + sequence[increment], y);
				increment++;
			}
		}
		const dissolveInterval = setInterval(dissolveHelper, duration / width);
	}
	this.animateSelection = function(text, x, y, duration) {
		const distance = text.length + 3;
		let position = 0;
		const display = this;
		function drawAnimation() {
			display.setFg('red');
			if (position == distance) {
				display.draw(' ', x - 2 + position, y);
				clearInterval(moveRight);
			} else {
				display.draw(' > ', x - 2 + position, y);
				position++;
			}
		}
		moveRight = setInterval(drawAnimation, duration / distance);
	}
}

module.exports = NewDisplay;
