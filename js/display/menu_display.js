const MenuDisplay = function(d) {
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
	const lobby = d.buffer.new(lobbyX, optionsY - 1, logoEndX - lobbyX, 15);
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
			if (i == option) menu.draw('>', 0, y, 'red');
			else d.buffer.setFg('reset');
			menu.draw(value, 2, y);
		}
		menu.save();
		drawCursor();
		menu.render();
	}
	const duration = 200;
	this.drawMenuSelection = async function(option) {
		d.waiting = true;
		return new Promise(function(resolve) {
			for (let i = 0; i < menuOptions.length; i++) {
				const selection = menuOptions[i];
				const x = menu.x + 2;
				const y = menu.y + 2 * i;
				if (i == option) d.animateSelection(menu, selection, 2, 2 * i);
				else d.dissolve(menuAnimation, selection.length, 2, 2 * i);
			}
			setTimeout(() => {
				d.waiting = false;
				resolve();
			}, duration + 175);
		});
	}

	// CURSOR
	const cursor = { x: 0, y: 0, visible: false, active: false };
	function drawCursor() {
		if (!cursor.active) return;
		if (cursor.visible) {
			menu.draw('█', cursor.x, cursor.y, 'red');
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
	const lastIndex = onlineOptions.length - 1;
	const connect = onlineOptions[lastIndex];
	this.drawOnline = async function(data, animateConnect = false, errorMessage = false) {
		for (let i = 0; i < onlineOptions.length - 1; i++) {
			const value = onlineOptions[i];
			const y = 3 * i;
			const inputText = data.buffer[i];
			if (i == data.option) {
				d.buffer.setColor('red', 'reset');
				menu.draw('> ' + value, 0, y);
				menu.cursorTo(2, y + 1);
				if (data.selectAll)
					d.buffer.setColor('black', 'red');
				if (inputText.length > 0)
					inputText.forEach(char => menu.write(char));
			} else {
				menu.draw(value, 2, y, 'white', 'reset');
				menu.cursorTo(2, y + 1);
				if (inputText.length > 0)
					inputText.forEach(char => menu.write(char));
				else menu.write('...');
			}
			d.buffer.setBg('reset');
		}
		const withinBuffer = data.option < onlineOptions.length - 1;
		menu.save();
		clearInterval(cursorBlink);
		if (withinBuffer) {
			if (data.filled) {
				menu.draw(connect, 2, 6, 'cyan');
				menu.save();
			}
			if (!data.selectAll) {
				cursor.x = 2 + data.cursorIndex;
				cursor.y = 3 * data.option + 1;
				startCursorBlink();
			}
			if (animateConnect) {
				const params = [menuAnimation, connect.length, 2, 6, 250];
				if (data.filled) {
					startingFrame = ' '.repeat(connect.length);
					params.push(connect, 'cyan');
				} else startingFrame = connect;
				if (d.animating) d.stopAnimating(menuAnimation);
				menuAnimation.draw(startingFrame, 2, 6, 'cyan');
				menuAnimation.render();
				d.dissolve(...params);
			}
		} else {
			d.stopAnimating(menuAnimation);
			cursor.active = false;
			menu.draw('> ' + connect, 0, 6, 'red');
			menu.save();
		}
		if (errorMessage) menu.draw(errorMessage, 2, 8, 'red');
		menu.render();
	}
	const connectionTimeouts = [];
	this.startConnectionLoading = async function() {
		d.waiting = true;
		d.animateSelection(menu, connect, 2, 6);
		// await d.wait(250);
		connectionTimeouts.push(setTimeout(() => {
			d.waiting = false;
			d.loadingDots(menu, 3, 2, 6)
		}, 250));
		connectionTimeouts.push(setTimeout(() => {
			menu.draw('Connecting', 2, 8, 'red').paint();
		}, 400));
		connectionTimeouts.push(setTimeout(() => {
			menu.draw('Press ESC to cancel', 2, 8, 'red').paint();
		}, 2200));
	}
	this.stopConnectionLoading = function(render = true, connection = false) {
		d.waiting = false;
		d.clearLoadingDots(menu, 2, 6);
		for (const timeout of connectionTimeouts) clearTimeout(timeout);
		if (render) {
			menu.load();
			if (connection) {
				menu.draw('  you connected breh', 0, 6, 'white');
			}
			menu.render();
		}
	}
	this.showConnectionError = function(message) {
		menu.load();
		drawCursor();
		menu.draw(message, 2, 8, 'red').render();
	}

	// LOBBY
	const divider = '─'.repeat(logoEndX - lobbyX);
	this.drawLobby = function(lobbyData) {
		lobby.draw(divider, 0, 0, 'magenta');
		let i = 0;
		lobbyData.forEach(player => {
			const y = 3 * i + 1;
			if (player.you) lobby.draw(player.name + ' (YOU)', 0, y, 'cyan');
			else lobby.draw(player.name, 0, y, 'white');
			if (player.ready) lobby.draw('READY', 0, y + 1, 'green');
			else lobby.draw('NOT READY', 0, y + 1, 'red');
			if (player.connected) {
				const ping = player.ping > 9999 ? 9999 : player.ping;
				const bars = Math.ceil(12 / ((ping / 50) ** 1.5 + 1));
				lobby.cursorTo(lobby.end - 12, y);
				lobby.write('|'.repeat(bars), 'green');
				lobby.write('|'.repeat(12 - bars), 'white');
				lobby.draw('Ping:', lobby.end - 12, y + 1);
				const pingString = ping.toString() + 'ms';
				lobby.draw(pingString, lobby.end - pingString.length, y + 1);
			}
			lobby.draw(divider, 0, y + 2, 'magenta');
		});
		lobby.render();
	}
	this.clearLobby = () => lobby.clear();

	// PROCESS
	this.start = function(option) {
		// logo.outline('green');
		menu.outline('magenta');
		lobby.outline('blue');
		this.drawLogo();
		this.drawMenu(option);
	}
	this.moveBuffers = function() {
		logo.move(logoX - 3, logoY);
		menu.move(logoX - 2, optionsY);
		lobby.move(lobbyX, optionsY - 1);
		menuAnimation.move(logoX - 2, optionsY);
		menu.load(true);
	}
	this.clear = () => { menu.clear(); lobby.clear();}
	this.exit = function() {
		logo.clear();
		menu.clear();
		lobby.clear();
	}
}

module.exports = MenuDisplay;
