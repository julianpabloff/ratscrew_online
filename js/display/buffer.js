const BufferManager = function() {
	this.screens = {};
	this.color = 0;
	this.lastRenderedColor = 0;
	this.colors = { reset: 0, black: 1, red: 2, green: 3, yellow: 4, blue: 5, magenta: 6, cyan: 7, white: 8 };

	this.addBuffer = function(buffer, screen) {
		let bufferArray = this.screens[screen];
		if (bufferArray == undefined)
			bufferArray = [];
		bufferArray.push(buffer);
	}
	this.setFg = function(color) {
		const fgCode = this.colors[color];
		this.color = (fgCode << 4) + (this.color & 0x0F);
	}
	this.setBg = function(color) {
		const bgCode = this.colors[color];
		this.color = (this.color & 0xF0) + bgCode;
	}
	this.setColor = function(foreground, background) {
		const fgCode = this.colors[foreground];
		const bgCode = this.colors[background];
		this.color = (fgCode << 4) + bgCode;
	}
	this.resetColor = function() {
		this.color = 0;
	}
}

const DisplayBuffer = function(x, y, width, height, manager) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.size = width * height;
	this.empty = true;

	function bufferWithSpaces(size) {
		let buffer = new Uint16Array(size);
		return buffer.fill(32);
	}
	this.current = bufferWithSpaces(this.size);
	this.previous = bufferWithSpaces(this.size);
	this.colors = new Uint8Array(this.size);
	this.prevColors = new Uint8Array(this.size);

	// Writing to buffer
	let cursorIndex = 0;
	function coordinateIndex(x, y) { return (y * width) + x; }
	function print(buffer, string, index) {
		for (let i = 0; i < string.length; i++) {
			buffer.current[index + i] = string.charCodeAt(i);
			buffer.colors[index + i] = manager.color;
		}
		cursorIndex = index + string.length;
	}
	this.cursorTo = function(x, y) {
		cursorIndex = coordinateIndex(x, y);
	}
	this.write = function(string) {
		print(this, string, cursorIndex);
	}
	this.draw = function(string, x, y) {
		const index = coordinateIndex(x, y);
		print(this, string, index);
	}

	// Rendering buffer
	function drawToScreen(string, x, y) {
		process.stdout.cursorTo(x, y);
		process.stdout.write(string);
	}
	let drawCount = 0;
	let colorChangeCount = 0;
	let currentColor = { fg: 0, bg: 0 };
	this.render = function(clearLastFrame = true) {
		for (let i = 0; i < this.size; i++) {
			let code = this.current[i];
			if (code == 0 && clearLastFrame) code = 32;
			const prevCode = this.previous[i];
			const colorCode = this.colors[i];
			const prevColorCode = this.prevColors[i];
			if (code != prevCode || colorCode != prevColorCode) {
				const fgCode = colorCode >> 4;
				const bgCode = colorCode & 0x0F;
				if (fgCode != currentColor.fg || colorCode != manager.lastRenderedColor) {
					process.stdout.write('\x1b[' + (29 * (fgCode != 0) + fgCode).toString() + 'm');
					currentColor.fg = fgCode;
					manager.lastRenderedColor = colorCode;
					colorChangeCount++;
				}
				if (bgCode != currentColor.bg || colorCode != manager.lastRenderedColor) {
					process.stdout.write('\x1b[' + (39 * (bgCode != 0) + bgCode).toString() + 'm');
					currentColor.bg = bgCode;
					manager.lastRenderedColor = colorCode;
					colorChangeCount++;
				}
				const x = i % this.width;
				const y = Math.floor(i / this.width);
				drawToScreen(String.fromCharCode(code), this.x + x, this.y + y);
				drawCount++;
			}
			this.current[i] = 0;
			this.previous[i] = code;
			this.colors[i] = 0;
			this.prevColors[i] = colorCode;
		}
		// drawToScreen('                ', this.x, this.y - 2);
		// drawToScreen('painted ' + drawCount.toString() + ' chars', this.x, this.y - 2);
		// drawToScreen('                          ', this.x, this.y + this.height + 1);
		// drawToScreen('changed color ' + colorChangeCount.toString() + ' times', this.x, this.y + this.height + 1);
		if (drawCount > 0) this.empty = false;
		drawCount = 0;
		colorChangeCount = 0;
	}
	this.paint = () => this.render(false); // For adding to the canvas without it clearing

	// Saving buffer and reading from the save
	let savedBuffer, savedColors;
	this.save = function() {
		savedBuffer = new Uint16Array(this.current);
		for (let i = 0; i < this.size; i++) {
			if (savedBuffer[i] == 0) savedBuffer[i] = 32;
		}
		savedColors = new Uint16Array(this.colors);
	}
	const colorLookup = ['reset', 'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
	this.read = function(x, y) {
		const index = coordinateIndex(x, y);
		const colorCode = savedColors[index];
		return {
			char: String.fromCharCode(savedBuffer[index]),
			fg: colorLookup[colorCode >> 4],
			bg: colorLookup[colorCode & 0x0F]
		};
	}

	this.clear = function() {
		this.current = bufferWithSpaces(this.size);
		this.colors = new Uint16Array(this.size);
		this.render();
		this.empty = true;
		if (outlined) this.outline('reset', false);
	}
	// Only meant to be used for when the screen dimensions change
	this.move = function(x, y) {
		const wasOutlined = outlined;
		const tempBuffer = new Uint16Array(this.previous);
		const tempColorBuffer = new Uint16Array(this.prevColors);
		this.clear();
		if (wasOutlined) this.outline('reset', false);
		this.current = tempBuffer;
		this.colors = tempColorBuffer;
		this.x = x; this.y = y;
		this.render();
		if (wasOutlined) this.outline(outlineColor);
	}

	// For seeing where it is
	let outlined = false;
	let outlineColor = 'reset';
	this.outline = function(color = 'reset', draw = true) {
		const fgCode = manager.colors[color];
		process.stdout.write('\x1b[0m');
		process.stdout.write('\x1b[' + (29 * (fgCode != 0) + fgCode).toString() + 'm');
		const sq = draw ?
			{tl: '┌', h: '─', tr: '┐', v: '│', bl: '└', br: '┘'}:
			{tl: ' ', h: ' ', tr: ' ', v: ' ', bl: ' ', br: ' '};
		drawToScreen(sq.tl + sq.h.repeat(this.width) + sq.tr, this.x - 1, this.y - 1);
		for (let i = 0; i < this.height; i++) {
			drawToScreen(sq.v, this.x - 1, this.y + i);
			drawToScreen(sq.v, this.x + this.width, this.y + i);
		}
		drawToScreen(sq.bl + sq.h.repeat(this.width) + sq.br, this.x - 1, this.y + this.height);
		outlined = draw;
		if (draw) outlineColor = color;
		currentColor = { fg: fgCode, bg: 0 };
	}
	this.outline.clear = () => {
		if (outlined) this.outline('reset', false);
	}
}

module.exports.BufferManager = BufferManager;
module.exports.DisplayBuffer = DisplayBuffer;
