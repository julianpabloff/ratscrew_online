const BufferManager = require('./buffer.js');
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
	this.buffer = new BufferManager();

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
	this.resize = function(screen) {
		this.setSize();
		const component = this[screen];
		component.setSize();
		component.moveBuffers();
	}

	this.exit = function(screen = 'menu') {
		this[screen].exit();
		// stdout.write('\x1b[?25h\x1b[0m\x1b[2J');
		stdout.write('\x1b[?25h\x1b[0m');
		stdout.cursorTo(0,0);
	}

	// Animations
	this.animating = false;
	this.waiting = false;
	const animations = [];
	this.dissolve = function(buffer, width, x, y, duration = 200, content = false, color = false) {
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
		function dissolveHelper() {
			if (increment == width) {
				buffer.paint();
				this.animating = false;
				clearInterval(dissolveInterval);
			} else {
				const char = content ? content[sequence[increment]] : ' ';
				if (color) this.buffer.setFg(color);
				buffer.draw(char, x + sequence[increment], y);
				buffer.paint();
				increment++;
			}
		}
		const dissolveInterval = setInterval(dissolveHelper.bind(this), duration / width);
		this.animating = true;
		animations.push(dissolveInterval);
	}
	this.animateSelection = function(buffer, text, x, y, duration = 200) {
		const distance = text.length + 3;
		let position = 0;
		function drawAnimation() {
			this.buffer.setFg('red');
			if (position == distance) {
				buffer.draw(' ', x - 2 + position, y);
				buffer.paint();
				this.animating = false;
				clearInterval(moveRight);
			} else {
				buffer.draw(' > ', x - 2 + position, y);
				buffer.paint();
				position++;
			}
		}
		const moveRight = setInterval(drawAnimation.bind(this), duration / distance);
		this.animating = true;
		animations.push(moveRight);
	}
	function coordinateSeed(x, y) {
		return y + (x << 8);
	}
	function seedCoordinates(seed) {
		return {x: seed >> 8, y: seed & 0xFF00}
	}
	this.dotObjects = new Map();
	this.drawLoadingDot = function(buffer, x, y, draw, color = 'red') {
		this.buffer.setFg(color);
		const char = draw ? '.' : ' ';
		buffer.draw(char, x, y);
		buffer.paint();
	}
	const dotTimeouts = [];
	this.loadingDots = function(buffer, count, x, y, interval = 300) {
		const loadingDots = new Uint8Array(count);
		const seed = coordinateSeed(x, y);
		this.dotObjects[seed] = { active: loadingDots, intervals: [] };
		const dot = this.dotObjects[seed];
		this.animating = true;
		for (let i = 0; i < count; i++) {
			dotTimeouts.push(setTimeout(() => {
				this.drawLoadingDot(buffer, x + i, y, true);
				dot.intervals.push(setInterval(() => {
					this.drawLoadingDot(buffer, x + i, y, dot.active[i]);
					dot.active[i] ^= 1;
				}, interval * count));
			}, interval * i));
		}
	}
	this.clearLoadingDots = function(buffer, x, y) {
		this.animating = false;
		for (const timeout of dotTimeouts) clearTimeout(timeout);
		const dot = this.dotObjects[coordinateSeed(x, y)];
		if (dot) {
			for (let i = 0; i < dot.intervals.length; i++) {
				clearInterval(dot.intervals[i]);
				if(dot.active[i]) this.drawLoadingDot(buffer, x + i, y, false);
			}
			delete this.dotObjects[coordinateSeed(x, y)];
		}
	}
	this.stopAnimating = function(buffer) {
		for (const animation of animations) {
			clearInterval(animation);
		}
		if (buffer.empty) buffer.clear();
		this.animating = false;
	}
	let waitTimeout;
	this.wait = async miliseconds => new Promise(resolve => waitTimeout = setTimeout(resolve, miliseconds));
}

module.exports = NewDisplay;
