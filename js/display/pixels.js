const PixelEngine = function(manager, buffer) {
	this.size = buffer.size * 2;
	this.grid = new Uint8Array(this.size);
	const colors = { reset: 0, black: 1, red: 2, green: 3, yellow: 4, blue: 5, magenta: 6, cyan: 7, white: 8 };
	const coordinateIndex = (x, y) => (y * buffer.width) + x; // grid x & y to grid array index
	this.draw = function(grid, x, y, invert = false) {
		const width = grid[0].length;
		const height = grid.length;
		for (let i = 0; i < height; i++) {
			const gridIndex = invert ? height - i - 1 : i;
			const index = coordinateIndex(x, y + i);
			for (let j = 0; j < width; j++) {
				const rowIndex = invert ? width - j - 1 : j;
				const pixel = grid[gridIndex][rowIndex];
				if (pixel) this.grid[index + j] = grid[gridIndex][rowIndex];
			}
		}
	}
	this.apply = function() {
		const output = [];
		for (let i = 0; i < this.size; i += buffer.width) {
			const starting = i % (buffer.width * 2) == 0;
			if (starting) output.push([]);
			const outputIndex = Math.floor(i / (buffer.width * 2));
			for (let j = 0; j < buffer.width; j++) {
				const pixel = this.grid[i + j];
				if (starting) {
					const item = {};
					if (pixel) item.char = '▀';
					else item.char = ' ';
					item.color = pixel << 4;
					output[outputIndex].push(item);
				} else if (pixel) {
					const item = output[outputIndex][j];
					const color = item.color;
					if (color == 0) {
						item.char = '▄';
						item.color = pixel << 4;
					} else item.color = (color & 0xF0) + pixel;
				}
			}
		}
		let i = 0;
		lastColor = manager.setColorCode(output[0][0].color);
		manager.setColorCode(lastColor);
			buffer.cursorTo(0,0);
		for (const pixelArray of output) {
			for (let pixelPair of pixelArray) {
				const color = pixelPair.color;
				if (color != lastColor) {
					manager.setColorCode(color);
					lastColor = color;
				}
				buffer.write(pixelPair.char);
			}
			i++;
		}
	}
	this.fill = (color) => this.grid.fill(colors[color]);
	this.fillArea = function(x, y, width, height, color) {
		const code = colors[color];
		for (let i = 0; i < height; i++) {
			const index = coordinateIndex(x, y + i);
			for (let j = 0; j < width; j++) this.grid[index + j] = code;
		}
	}
}

module.exports = PixelEngine;
