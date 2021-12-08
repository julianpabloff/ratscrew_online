const BufferManager = require('./buffer.js');
const MenuDisplay = require('./menu_display.js');
const GameDisplay = require('./game_display.js');

const Display = function() {
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
	this.menu = new MenuDisplay(this);
	// this.game = new GameDisplay(this);
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
	const coordinateSeed = (x, y) => y + (x << 8);
	const animations = new Map();
	this.startAnimation = function(x, y) {
		this.animating = true;
		const seed = coordinateSeed(x, y);
		animations.set(seed, []);
		return animations.get(seed);
	}
	this.endAnimation = function(x, y) {
		const seed = coordinateSeed(x, y);
		const timeouts = animations.get(seed);
		for (const timeoutheh of timeouts) clearTimeout(timeoutheh);
		animations.delete(seed);
		if (animations.size == 0) this.animating = false;
	}
	this.dissolve = function(buffer, width, x, y, duration = 200, content = false, color = false) {
		const timeouts = this.startAnimation(x, y);
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
		for (let i = 0; i < width; i++) {
			timeouts.push(setTimeout(() => {
				const char = content ? content[sequence[i]] : ' ';
				if (color) this.buffer.setFg(color);
				buffer.draw(char, x + sequence[i], y);
				buffer.paint();
			}, (duration / width) * i));
		}
		timeouts.push(setTimeout(() => this.endAnimation(x, y), duration));
	}
	this.animateSelection = function(buffer, text, x, y, duration = 200) {
		const timeouts = this.startAnimation(x, y);
		const distance = text.length + 3;
		let position = 0;
		for (let i = 0; i < distance; i++) {
			timeouts.push(setTimeout(() => {
				this.buffer.setFg('red');
				buffer.draw(' > ', x + i - 2, y).paint();
			}, (duration / distance) * i));
		}
		timeouts.push(setTimeout(() => {
			buffer.draw(' ', x + distance - 2, y).paint();
			this.endAnimation(x, y);
		}, duration));
	}
	this.stopAnimating = function(buffer = false) {
		animations.forEach(timeout => clearTimeout(timeout));
		this.animating = false;
		if (buffer) buffer.clear();
	}

	this.drawLoadingDot = function(buffer, x, y, draw, color = 'red') {
		this.buffer.setFg(color);
		const char = draw ? '.' : ' ';
		buffer.draw(char, x, y).paint();
	}
	let dotTimeouts = [];
	this.dotObjects = new Map();
	this.loadingDots = function(buffer, x, y, count = 3, interval = 300) {
		const seed = coordinateSeed(x, y);
		const dotArray = new Uint8Array(count).fill(1);
		this.dotObjects.set(seed, { active: dotArray, intervals: [] });
		const dot = this.dotObjects.get(seed);
		for (let i = 0; i < count; i++) {
			dotTimeouts.push(setTimeout(() => {
				this.drawLoadingDot(buffer, x + i, y, true);
				dot.intervals.push(setInterval(() => {
					dot.active[i] ^= 1;
					this.drawLoadingDot(buffer, x + i, y, dot.active[i]);
				}, interval * count));
			}, interval * i));
		}
	}
	this.clearLoadingDots = function(buffer, x, y) {
		for (const timeout of dotTimeouts) clearTimeout(timeout);
		dotTimeouts = [];
		const seed = coordinateSeed(x, y);
		const dot = this.dotObjects.get(seed);
		if (dot) {
			let i = 0;
			for (let interval of dot.intervals) {
				clearInterval(interval);
				i++;
			}
			// buffer.paint();
			this.dotObjects.delete(seed);
		}
	}
	const debug = this.buffer.new(0, 0, columns, 2, 3);
	this.debug = function(item) {
		debug.draw(item, 0, 0, 'yellow').render();
	}
}

module.exports = Display;
