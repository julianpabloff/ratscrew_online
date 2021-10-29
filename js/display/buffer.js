const DisplayBuffer = function(x, y, width, height) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.size = width * height;

	function initBuffer(size) {
		let buffer = new Uint8Array(size);
		for (let i = 0; i < size; i++) {
			buffer[i] = 32;
		}
		return buffer;
	}
	this.current = initBuffer(this.size);
	this.previous = initBuffer(this.size);
	this.colors = new Uint8Array(this.size);
	// this.initBuffer(this.current);
	// this.initBuffer(this.previous);


	const colors = {
		fg : { black:'\x1b[30m', red:'\x1b[31m', green:'\x1b[32m', magenta:'\x1b[35m', blue:'\x1b[34m', cyan:'\x1b[36m', white:'\x1b[37m', reset:'\x1b[0m' },
		bg : { black:'\x1b[40m', red:'\x1b[41m', green:'\x1b[42m', magenta:'\x1b[45m', blue:'\x1b[44m', cyan:'\x1b[46m', white:'\x1b[47m', reset:'\x1b[0m' }
	};
	const colorCodes = { reset: 0, black: 1, red: 2, green: 3, yellow: 4, blue: 5, magenta: 6, cyan: 7, white: 8 };
	function toColorCode(fg, bg) {
		// 8 bits, first 4 for foreground, the last 4 for background
		return (colorCodes[fg] << 4) + colorCodes[bg];
	}
	function toColorString(code) {
		
	}

	function coordinateIndex(x, y) { return (y * width) + x; }
	this.draw = function(string, x, y, foreground = 'reset', background = 'reset') {
		const index = coordinateIndex(x, y);
		for (let i = 0; i < string.length; i++) {
			this.current[index + i] = string.charCodeAt(i);
			this.colors[index + i] = convertToColorCode(foreground, background);
		}
	}

	function drawToScreen(string, x, y, foreground = colors.fg.reset, background = colors.bg.reset) {
		process.stdout.cursorTo(x, y);
		process.stdout.write(string);
	}
	let drawCount = 0;
	let currentColor = 0;
	this.render = function() {
		for (let i = 0; i < this.size; i++) {
			const code = this.current[i];
			const prevCode = this.previous[i];
			if (code != prevCode) {
				const x = i % this.width;
				const y = Math.floor(i / this.width);
				drawToScreen(String.fromCharCode(code), this.x + x, this.y + y);
				drawCount++;
			}
			this.current[i] = 32;
			this.previous[i] = code;
			this.colors[i] = 0;
		}
		drawToScreen('                          ', 10, 5);
		drawToScreen('painted ' + drawCount.toString() + ' chars', 10, 5);
		drawCount = 0;
	}
	this.clear = function() {
		this.current = initBuffer(this.size);
		this.render();
	}
}

const stdout = process.stdout;
const rows = stdout.rows;
const columns = stdout.columns;

function draw(string, x, y) {
	stdout.cursorTo(x, y);
	stdout.write(string);
}

function drawBox(x, y, width, height) {
	draw('┌' + '─'.repeat(width - 2) + '┐', x, y);
	for (let i = 0; i < height - 2; i++) {
		draw('│', x, y + 1 + i);
		draw('│', x + width - 1, y + 1 + i);
	}
	draw('└' + '─'.repeat(width - 2) + '┘', x, y + height - 1);
}

async function wait(miliseconds) {
	return new Promise(function(resolve) {
		setTimeout(() => {
			resolve();
		}, miliseconds);
	});
}

async function test() {
	stdout.write('\x1b[2J'); // clear screen
	stdout.write('\x1b[?25l'); // hide cursor

	const logo = [
		'   ____________ ___________ ____    ____ ___________ ___________ ___________ ___________ ____________',
		' /\\     ______\\\\    ______\\\\   \\  /\\   \\\\    ___   \\\\____   ___\\\\____   ___\\\\    ___   \\\\    ____   \\',
		'\\ \\    \\_____/_\\   \\   __/_\\   \\_\\_\\   \\\\   \\_/\\   \\___/\\  \\__//___/\\  \\__/ \\   \\__\\   \\\\   \\__/\\   \\',
		'\\ \\     ______\\\\   \\ /\\   \\\\____    ___\\\\    ______\\  \\ \\  \\      \\ \\  \\  \\ \\    ___   \\\\   \\ \\ \\   \\',
		'\\ \\    \\_____/_\\   \\__\\   \\___/\\   \\_/\\ \\   \\_____/   \\ \\  \\     _\\_\\  \\__\\_\\   \\  \\   \\\\   \\ \\ \\   \\',
		'\\ \\___________\\\\__________\\  \\ \\___\\  \\ \\___\\         \\ \\__\\   /\\__________\\\\___\\  \\___\\\\___\\ \\ \\___\\',
		'\\/___________/___________/   \\/___/   \\/___/          \\/__/   \\/__________//___/ \\/___//___/  \\/___/ ',
		'   ____________ ___________ ___________ ___________ ___________ ___________ ___________ ___       ___',
		' /\\     ______\\\\_______   \\\\____   ___\\\\    ______\\\\    ______\\\\     _____\\\\    ___   \\\\  \\  ___/\\  \\',
		'\\ \\    \\_____//_______\\   \\___/\\  \\__/ \\   \\_____/_\\   \\_____/ \\    \\____/ \\   \\_/\\   \\\\  \\/\\  \\ \\  \\',
		'\\ \\    \\      /\\    ___   \\  \\ \\  \\  \\ \\_______   \\\\   \\     \\ \\    \\    \\ \\    ______\\\\  \\ \\  \\ \\  \\',
		'\\ \\    \\     \\ \\   \\_/\\   \\  \\ \\  \\  \\/_______\\   \\\\   \\_____\\_\\    \\    \\ \\   \\_____/_\\  \\_\\  \\_\\  \\',
		'\\ \\____\\     \\ \\__________\\  \\ \\__\\   /\\__________\\\\__________\\\\____\\    \\ \\__________\\\\____________\\',
		'\\/____/      \\/__________/   \\/__/   \\/__________//__________//____/     \\/__________//____________/ ',
	];
	const logoWidth = logo[0].length;
	const logoHeight = logo.length;

	function drawLogo() {
		const offset = Math.floor(logoHeight / 2) - 2;
		for (let i = 0; i < logoHeight; i++) {
			const x = logoX - offset + i - (i > 6) * 4;
			const y = logoY + i;
			let currentChar = ' ';
			for (let j = 0; j < logoWidth; j++) {
				const char = logo[i][j];
				if (char != currentChar && char != ' ') currentChar = char;
				else continue;
			}
		}
	}

	const bufferWidth = logoWidth;
	const bufferHeight = logoHeight + 2;
	const bufferSize = bufferWidth * bufferHeight;
	const bufferX = Math.floor(columns / 2 - bufferWidth / 2);
	const bufferY = Math.floor(rows / 2 - bufferHeight / 2);

	const buffer = new DisplayBuffer(bufferX, bufferY, bufferWidth, bufferHeight);
	drawBox(bufferX - 1, bufferY - 1, bufferWidth + 2, bufferHeight + 2);

	/*
	await wait(1000);
	buffer.draw('hello world', 3, 4);
	buffer.render();
	await wait(1000);
	buffer.draw('hello world', 5, 4);
	buffer.render();
	await wait(1000);
	buffer.draw('hello world', 10, 3);
	buffer.draw('hello world', 17, 18);
	buffer.render();
	*/

	stdout.cursorTo(0, rows - 2);
	stdout.write('\x1b[?25h\x1b[0m'); // show cursor
}
test();
