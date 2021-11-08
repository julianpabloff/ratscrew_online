const BufferManager = function() {
	function sortedIndex(array, value) {
		let low = 0;
        let high = array.length;
		while (low < high) {
			const mid = (low + high) >>> 1;
			if (array[mid].zIndex < value) low = mid + 1;
			else high = mid;
		}
		return low;
	}
	this.zArray = [];
	this.new = function(x, y, width, height, zIndex = 0) {
		const buffer = new DisplayBuffer(x, y, width, height, this, zIndex);
		if (this.zArray.length > 0) this.zArray.splice(sortedIndex(this.zArray, zIndex), 0, buffer);
		else this.zArray.push(buffer);
		return buffer;
	}
	this.somethingAbove = function(target, x, y) {
		if (this.zArray.length < 2) return false;
		let found = false;
		for (const buffer of this.zArray) {
			const index = buffer.screenToIndex(x, y);
			if (found && index != null) {
				if (!buffer.transparent) return true;
				const code = buffer.previous[index];
				if (code != 0) return true;
			}
			if (buffer.id == target.id) found = true;
		}
		return false;
	}
	this.somethingBelow = function(target, x, y) {
		if (this.zArray.length < 2) return false;
		let found = false;
		for (let i = this.zArray.length - 1; i >= 0; i--) {
			const buffer = this.zArray[i];
			const index = buffer.screenToIndex(x, y);
			if (found && index != null) {
				const code = buffer.previous[index];
				const color = buffer.prevColors[index];
				if (code != 0 || color != 0) return { char: code, color: color };
				else if (!buffer.transparent) return false;
			}
			if (buffer.id == target.id) found = true; 
		}
		return false;
	}
	// All coordinates are buffer relative
	// first four coordinates are for target selection, final x and y are the destination cooridinates
	this.clone = function(target, destination, leftX, topY, rightX, bottomY, x, y) {
		const width = rightX - leftX + 1;
		const height = bottomY - topY + 1;
		if (width < 1 || height < 1) return;
		const area = width * height;
		let readIndex = target.coordinateIndex(leftX, topY);
		let writeIndex = destination.coordinateIndex(x, y);
		let i = 0;
		do {
			destination.current[writeIndex] = target.current[readIndex];
			i++;
			if (i % width == 0) {
				readIndex = target.coordinateIndex(leftX, topY + (i / width));
				writeIndex = destination.coordinateIndex(x, y + (i / width));
			} else {
				readIndex++;
				writeIndex++;
			}
		} while (i < area);
	}

	// Colors
	this.color = 0;
	this.lastRenderedColor = 0;
	this.colors = { reset: 0, black: 1, red: 2, green: 3, yellow: 4, blue: 5, magenta: 6, cyan: 7, white: 8 };
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

const crypto = require('crypto');
const DisplayBuffer = function(x, y, width, height, manager, zIndex = 0) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.size = width * height;
	this.empty = true;
	this.outlined = false;
	this.zIndex = zIndex;
	this.transparent = true;
	this.id = crypto.randomBytes(32);

	function bufferWithSpaces(size) {
		let buffer = new Uint16Array(size);
		return buffer.fill(32);
	}
	this.current = new Uint16Array(this.size);
	this.previous = new Uint16Array(this.size);
	this.colors = new Uint8Array(this.size);
	this.prevColors = new Uint8Array(this.size);

	// Coordinates
	this.coordinateIndex = (x, y) => (y * this.width) + x; // buffer x & y to buffer array index
	this.indexToScreen = (index) => { return {x: this.x + (index % this.width), y: this.y + Math.floor(index / this.width)} }
	this.screenToIndex = function(x, y) {
		if (x < this.x || x >= this.x + this.width || y < this.y || y >= this.y + this.height) return null;
		return ((y - this.y) * this.width) + x - this.x;
	}

	// Writing to buffer
	let cursorIndex = 0;
	this.print = function(string, index) {
		for (let i = 0; i < string.length; i++) {
			this.current[index + i] = string.charCodeAt(i);
			this.colors[index + i] = manager.color;
		}
		cursorIndex = index + string.length;
		if (cursorIndex > this.size) cursorIndex = this.size;
	}
	this.cursorTo = function(x, y) {
		cursorIndex = this.coordinateIndex(x, y);
	}
	this.write = function(string) {
		this.print(string, cursorIndex);
	}
	this.draw = function(string, x, y) {
		const index = this.coordinateIndex(x, y);
		this.print(string, index);
	}
	this.erase = function(x, y, count = 1) {
		const index = this.coordinateIndex(x, y);
		for (let i = 0; i < count; i++) {
			this.current[index + i] = 0;
			this.colors[index + i] = 0;
		}
	}

	// Rendering buffer
	function drawToScreen(string, x, y) {
		process.stdout.cursorTo(x, y);
		process.stdout.write(string);
	}
	this.render = function(clearLastFrame = true) {
		for (let i = 0; i < this.size; i++) {
			let code = this.current[i];
			const prevCode = this.previous[i];
			const colorCode = this.colors[i];
			const prevColorCode = this.prevColors[i];

			const screenLocation = this.indexToScreen(i);
			let drawingCode = code;
			let drawingColorCode = colorCode;
			if (code == 0 && clearLastFrame) {
				const below = manager.somethingBelow(this, screenLocation.x, screenLocation.y);
				if (below) {
					drawingCode = below.char;
					drawingColorCode = below.color;
				} else {
					if (!this.transparent) code = 32;
					drawingCode = 32;
					drawingColorCode = 0;
				}
			}
			if (code != prevCode || colorCode != prevColorCode) {
				if (!manager.somethingAbove(this, screenLocation.x, screenLocation.y)) {
					const fgCode = drawingColorCode >> 4;
					const bgCode = drawingColorCode & 0x0F;
					if (drawingColorCode != manager.lastRenderedColor) {
						if (fgCode == 0 || bgCode == 0) process.stdout.write('\x1b[0m');
						if (fgCode > 0) process.stdout.write('\x1b[' + (29 + fgCode).toString() + 'm');
						if (bgCode > 0) process.stdout.write('\x1b[' + (39 + bgCode).toString() + 'm');
					}
					drawToScreen(String.fromCharCode(drawingCode), screenLocation.x, screenLocation.y);
					manager.lastRenderedColor = drawingColorCode;
				}
			}
			this.current[i] = 0;
			this.previous[i] = code;
			this.colors[i] = 0;
			this.prevColors[i] = colorCode;
		}
	}
	this.paint = () => this.render(false); // For adding to the canvas without it clearing
	this.fill = function(color, char = ' ') {
		this.current.fill(char.charCodeAt(0));
		manager.setBg(color);
		this.colors.fill(manager.color);
	}

	// Saving buffer and reading from the save
	let savedBuffer, savedColors;
	this.save = function() {
		savedBuffer = new Uint16Array(this.current);
		for (let i = 0; i < this.size; i++) {
			if (savedBuffer[i] == 0) savedBuffer[i] = 32;
		}
		savedColors = new Uint8Array(this.colors);
	}
	const colorLookup = ['reset', 'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
	this.read = function(x, y) {
		const index = this.coordinateIndex(x, y);
		const colorCode = savedColors[index];
		return {
			char: String.fromCharCode(savedBuffer[index]),
			fg: colorLookup[colorCode >> 4],
			bg: colorLookup[colorCode & 0x0F]
		};
	}
	this.load = function() {
		this.current = new Uint16Array(savedBuffer);
		this.colors = new Uint8Array(savedColors);
		this.render();
	}

	this.clear = function() {
		this.current = new Uint16Array(this.size);
		this.colors = new Uint8Array(this.size);
		this.render();
		this.empty = true;
		if (this.outlined) this.outline('reset', false);
	}
	// Only meant to be used for when the screen dimensions change
	this.move = function(x, y) {
		const wasOutlined = this.outlined;
		const tempBuffer = new Uint16Array(this.previous);
		const tempColorBuffer = new Uint8Array(this.prevColors);
		this.clear();
		if (wasOutlined) this.outline('reset', false);
		this.current = tempBuffer;
		this.colors = tempColorBuffer;
		this.x = x; this.y = y;
		this.render();
		if (wasOutlined) this.outline(outlineColor);
	}

	// For seeing where it is
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
		this.outlined = draw;
		if (draw) outlineColor = color;
		currentColor = { fg: fgCode, bg: 0 };
	}
	this.outline.clear = () => {
		if (this.outlined) this.outline('reset', false);
	}
}

module.exports = BufferManager;
