const NewMenuDispaly = function(d) {
	const logoStrings = [
		'   ____________ ___________ ____    ____ ___________ ___________ ___________ ___________ ____________',
		' /\\     ______\\\\    ______\\\\   \\  /\\   \\\\    ___   \\\\____   ___\\\\____   ___\\\\    ___   \\\\    ____   \\',
		'\\ \\    \\_____/_\\   \\   __/_\\   \\_\\_\\   \\\\   \\_/\\   \\___/\\  \\__//___/\\  \\__/ \\   \\_/\\   \\\\   \\__/\\   \\',
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
	const logoWidth = logoStrings[0].length;
	const logoHeight = logoStrings.length;

	this.setSize = function() {
		logoX = d.centerWidth(logoWidth);
		logoY = d.centerHeight(30);
		optionsY = logoY + logoHeight + 4;
		lobbyX = logoX + 40;
		logoEndX = logoX + logoWidth;
	}
	let logoX, logoY, optionsY, lobbyX, lobbyEndX;
	this.setSize();

	// BUFFERS
	const logo = d.buffer.new(logoX - 3, logoY, logoWidth + 6, logoHeight);
	const menu = d.buffer.new(logoX - 2, optionsY, 35, 15);
	menu.transparent = false;
	const menuAnimation = d.buffer.new(logoX - 2, optionsY, 35, 15, 1);

	// LOGO
	this.drawLogo = function() {
		const offset = Math.floor(logoHeight / 2) - 2;
		for (let i = 0; i < logoHeight; i++) {
			const x = 3 - offset + i - (i > 6) * 4;
			const y = i;
			let currentChar = ' ';
			for (let j = 0; j < logoWidth; j++) {
				const char = logoStrings[i][j];
				if (char != currentChar && char != ' ') {
					currentChar = char;
					if (currentChar == '\\') d.buffer.setFg('magenta');
					else if (currentChar == '_') d.buffer.setFg('cyan');
					else if (currentChar == '/') d.buffer.setFg('red');
				}
				if (char != ' ') logo.draw(char, x + j, y);
			}
		}
		logo.render();
	}

	// MENU
	const menuOptions = ['LOCAL', 'ONLINE', 'SETTINGS'];
	this.drawMenu = function(option) {
		for (let i = 0; i < menuOptions.length; i++) {
			const value = menuOptions[i];
			const y = 2 * i;
			if (i == option) {
				d.buffer.setFg('red');
				menu.draw('>', 0, y);
			} else d.buffer.setFg('reset');
			menu.draw(value, 2, y);
		}
		menu.save();
		drawCursor();
		menu.render();
	}
	const duration = 200;
	this.drawMenuSelection = async function(option) {
		d.waitForAnimation = true;
		return new Promise(function(resolve) {
			for (let i = 0; i < menuOptions.length; i++) {
				const selection = menuOptions[i];
				const x = menu.x + 2;
				const y = menu.y + 2 * i;
				if (i == option) d.animateSelection(menuAnimation, selection, 2, 2 * i, duration);
				// if (i == option) continue;
				else d.dissolve(menuAnimation, selection.length, 2, 2 * i, duration);
			}
			setTimeout(() => {
				d.waitForAnimation = false;
				resolve();
			}, duration + 175);
		});
	}

	// CURSOR
	const cursor = { x: 0, y: 0, visible: false, active: false };
	function drawCursor() {
		if (!cursor.active) return;
		if (cursor.visible) {
			d.buffer.setFg('red');
			menu.draw('█', cursor.x, cursor.y);
		} else {
			const underCursor = menu.read(cursor.x, cursor.y);
			d.buffer.setFg(underCursor.fg);
			menu.draw(underCursor.char, cursor.x, cursor.y);
		}
	}
	let cursorBlink;
	function startCursorBlink() {
		cursor.active = true;
		cursor.visible = true;
		drawCursor();
		cursorBlink = setInterval(() => {
			cursor.visible = !cursor.visible;
			if (cursor.active) {
				drawCursor();
				menu.paint();
			}
		}, 500);
	}
	this.hideCursor = function() {
		clearInterval(cursorBlink);
		cursor.visible = false;
		drawCursor();
		cursor.active = false;
	}
	this.toggleCursor = function(show) {
		cursor.active = show;
	}

	// ONLINE
	const onlineOptions = ['SERVER ADDRESS', 'YOUR NAME', 'CONNECT'];
	this.drawOnline = function(option, textBuffer, textCursor, showConnect, animateConnect = false) {
		for (let i = 0; i < onlineOptions.length - 1; i++) {
			const value = onlineOptions[i];
			const y = 3 * i;
			const inputText = textBuffer[i];
			if (i == option) {
				d.buffer.setColor('red', 'reset');
				menu.draw('> ' + value, 0, y);
				menu.cursorTo(2, y + 1);
				if (textCursor.selected)
					d.buffer.setColor('black', 'red');
				if (inputText.length > 0)
					inputText.forEach(char => menu.write(char));
			} else {
				d.buffer.setColor('white', 'reset');
				menu.draw(value, 2, y);
				menu.cursorTo(2, y + 1);
				if (inputText.length > 0)
					inputText.forEach(char => menu.write(char));
				else menu.write('...');
			}
			d.buffer.setBg('reset');
		}
		const lastIndex = onlineOptions.length - 1;
		const withinBuffer = option < onlineOptions.length - 1;
		const connect = onlineOptions[lastIndex];
		const connectY = 3 * lastIndex;
		menu.save();
		clearInterval(cursorBlink);
		if (withinBuffer) {
			d.buffer.setFg('cyan');
			if (showConnect) {
				menu.draw(connect, 2, connectY);
			}
			if (!textCursor.selected) {
				cursor.x = textCursor.index + 2;
				cursor.y = 3 * option + 1;
				startCursorBlink();
			}
			if (animateConnect) {
				const params = [menuAnimation, connect.length, 2, connectY, 250];
				if (showConnect) {
					startingFrame = ' '.repeat(connect.length);
					params.push(connect, 'cyan');
				} else startingFrame = connect;
				if (d.animating) d.stopAnimating(menuAnimation);
				d.buffer.setFg('cyan');
				menuAnimation.draw(startingFrame, 2, connectY);
				menuAnimation.render();
				d.dissolve(...params);
			}
		} else {
			d.stopAnimating(menuAnimation);
			cursor.active = false;
			d.buffer.setFg('red');
			menu.draw('> ' + connect, 0, connectY);
		}
		menu.render();
	}
	this.startConnectionLoading = function() {
		let increment = 0;
		function drawLoadingDot(x, y, draw) {
		}
	}

	// PROCESS
	this.start = function(option) {
		// logo.outline('green');
		menu.outline('magenta');
		this.drawLogo();
		this.drawMenu(option);
	}
	this.moveBuffers = function() {
		logo.move(logoX - 3, logoY);
		menu.move(logoX - 2, optionsY);
		menuAnimation.move(logoX - 2, optionsY);
		menu.load();
	}
	this.clear = () => { menu.clear(); }
	this.exit = function() {
		menu.clear();
		logo.clear();
	}
	// this.dissolve = function() {
	// 	d.dissolve(7, menu.x, menu.y, 1000);
	// }
}

module.exports = NewMenuDispaly;
