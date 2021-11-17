const PixelEngine = function(manager, buffer) {
	// const grid = [
	// 	[2, 3, 5, 0, 7, 3],
	// 	[6, 5, 0, 4, 2, 8],
	// ];
	// [▀,▀,▀, ],
	// [ , , , ]
	this.buffer = buffer;
	this.size = buffer.size * 2;
	this.grid = new Uint8Array(this.size);
	this.drawGrid = function(grid, x, y) {
		const output = [];
		for (let y = 0; y < grid.length; y++) {
			const row = grid[y];
			const starting = y % 2 == 0;
			if (starting) output.push([]);
			for (let x = 0; x < row.length; x++) {
				const pixel = row[x];
				const outputIndex = Math.floor(y / 2);
				if (starting) {
					const item = {};
					if (pixel) item.char = '▀';
					else item.char = ' ';
					item.color = pixel << 4;
					output[outputIndex].push(item);
				} else if (pixel) {
					const item = output[outputIndex][x];
					const color = item.color;
					if (color == 0) {
						item.char = '▄';
						item.color = pixel << 4;
					} else item.color = (color & 0xF0) + pixel;
				}
			}
		}
		// return output;
		// process.stdout.cursorTo(0,5);
		// console.log(output);
		let i = 0;
		lastColor = manager.setColorCode(output[0][0].color);
		manager.setColorCode(lastColor);
		for (const pixelArray of output) {
			buffer.cursorTo(x, y + i);
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
		// buffer.render();
		// return buffer;
	}
	const colors = { reset: 0, black: 1, red: 2, green: 3, yellow: 4, blue: 5, magenta: 6, cyan: 7, white: 8 };
	this.draw = function(color, x, y) {
		this.grid[this.buffer.coordinateIndex(x, y * 2)] = colors[color];
	}
	function drawToScreen(string, x, y) {
		process.stdout.cursorTo(x, y);
		process.stdout.write(string);
	}
	this.render = function() {
		process.stdout.cursorTo(0,0);
		console.log('\x1b[0m');
		console.log(this.grid);
		for (let i = 0; i < this.size; i++) {
			
		}
	}
}

module.exports = PixelEngine;
