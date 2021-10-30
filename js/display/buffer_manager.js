const BufferDataManager = function() {
	this.screens = {};
	this.color = 0;
	this.lastRenderedColor = 0;
	const colors = { reset: 0, black: 1, red: 2, green: 3, yellow: 4, blue: 5, magenta: 6, cyan: 7, white: 8 };

	this.addBuffer = function(buffer, screen) {
		let bufferArray = this.screens[screen];
		if (bufferArray == undefined)
			bufferArray = [];
		bufferArray.push(buffer);
	}
	this.setFg = function(color) {
		const fgCode = colors[color];
		this.color = (fgCode << 4) + (this.color & 0x0F);
	}
	this.setBg = function(color) {
		const bgCode = colors[color];
		this.color = (this.color & 0xF0) + bgCode;
	}
	this.setColor = function(foreground, background) {
		const fgCode = colors[foreground];
		const bgCode = colors[background];
		this.color = (fgCode << 4) + bgCode;
	}
	this.resetColor = function() {
		this.color = 0;
	}
}

module.exports = BufferDataManager;
