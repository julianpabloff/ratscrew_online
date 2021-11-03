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
	let logoX, logoY, optionsY, lobbyX;
	this.setSize();

	// LOGO
	const logo = d.addBuffer(logoX - 3, logoY, logoWidth + 6, logoHeight, 'menu');

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
	const menu = d.addBuffer(logoX - 2, optionsY, 35, 15, 'menu');

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
		d.animating = true;
		return new Promise(function(resolve) {
			for (let i = 0; i < menuOptions.length; i++) {
				const selection = menuOptions[i];
				const x = menu.x + 2;
				const y = menu.y + 2 * i;
				if (i == option) d.animateSelection(selection, x, y, duration);
				else d.dissolve(selection.length, x, y, duration);
			}
			setTimeout(() => {
				d.animating = false;
				resolve();
			}, duration + 100);
		});
	}

	// ONLINE
	const onlineOptions = ['SERVER ADDRESS', 'YOUR NAME', 'CONNECT'];
	const cursor = { x: 5, y: 0, visible: false, active: true };
	function drawCursor() {
		const underCursor = menu.read(cursor.x, cursor.y);
		if (cursor.visible) {
			d.buffer.setFg('red');
			menu.draw('█', cursor.x, cursor.y);
		} else {
			d.buffer.setFg(underCursor.fg);
			menu.draw(underCursor.char, cursor.x, cursor.y);
		}
	}
	let cursorBlink = setInterval(() => {
		cursor.visible = !cursor.visible;
		if (!cursor.active) return;
		d.buffer.setFg('red');
		drawCursor();
		menu.paint();
	}, 600);

	// BUFFERS
	this.start = function(option) {
		logo.outline('green');
		menu.outline('magenta');
		this.drawLogo();
		this.drawMenu(option);
	}
	this.update = function(option) {
		this.drawMenu(option);
	}
	this.clear = () => { menu.clear(); }
	this.exit = function() {
		menu.clear();
		logo.clear();
	}

	this.dissolve = function() {
		d.dissolve(7, menu.x, menu.y, 1000);
	}
}

module.exports = NewMenuDispaly;
