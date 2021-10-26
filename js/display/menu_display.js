const EventEmitter = require('events');
const displayEmitter = new EventEmitter();

const MenuDisplay = function(d) {
	
	let stdout = process.stdout;

	const logo = [
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
	const logoWidth = logo[0].length;
	const logoHeight = logo.length;

	this.setSize = function() {
		logoX = d.centerWidth(logoWidth);
		logoY = d.centerHeight(30);
		optionsY = logoY + logoHeight + 4;
	}
	let logoX, logoY, optionsY;
	this.setSize();

	this.drawLogo = function() {
		const offset = Math.floor(logo.length / 2) - 2;
		const logoLength = logo.length;
		for (let i = 0; i < logoLength; i++) {
			const x = (logoX - offset + i - (i > 6) * 4);
			const y = (logoY + i);
			stdout.cursorTo(x, y);
			let currentChar = '';
			for (let j = 0; j < logo[i].length; j++) {
				const char = logo[i][j];
				if (char != currentChar && char != ' ') currentChar = char;
				if (currentChar == '\\') d.setFg('magenta');
				else if (currentChar == '_') d.setFg('cyan');
				else if (currentChar == '/') d.setFg('red');
				stdout.write(char);
			}
		}
	}

	this.animationDuration = 250;
	let animating = false;
	function dissolve(width, x, y, duration, content = false, color = false) {
		let positions = [];
		let sequence = [];
		for (let i = 0; i < width; i++)
			positions.push(false);
		for (let i = width; i >= 1; i--) {
			let random = Math.floor(Math.random() * i) + 1;
			let count = 0;
			for (let j = 0; j < width; j++) {
				if (!positions[j]) count++;
				if (count == random) {
					positions[j] = true;
					sequence.push(j);
					break;
				}
			}
		}
		let increment = 0;
		function dissolveHelper() {
			if (increment == width) {
				clearInterval(dissolveInterval);
				animating = false;
				displayEmitter.emit('doneAnimating');
			}
			else {
				let char = content ? content[sequence[increment]] : ' ';
				if (color) d.setFg(color);
				d.draw(char, x + sequence[increment], y);
				increment++;
			}
		}
		animating = true;
		const dissolveInterval = setInterval(dissolveHelper, duration / width);
	}

	let moveRight;
	let position;
	function animateSelection(text, x, y, duration) {
		const distance = text.length + 3;
		position = 0;
		function drawAnimation() {
			d.setFg('red');
			if (position == distance) {
				d.draw(' ', x - 2 + position, y);
				clearInterval(moveRight);
				animating = false;
				displayEmitter.emit('doneAnimating');
			} else {
				d.draw(' > ', x - 2 + position, y);
				position++;
			}
		}
		animating = true;
		moveRight = setInterval(drawAnimation, Math.floor(duration/distance));
	}

	this.waitForAnimation = async function() {
		return new Promise(function(resolve, reject) {
			displayEmitter.once('doneAnimating', () => {
				resolve();
			});
		});
	}

	this.draw = async function(name, arguments) {
		await this.waitForAnimation();
		this[name](...arguments);
	}

	// MAIN MENU //

	const options = ['LOCAL', 'ONLINE', 'SETTINGS'];
	this.drawMenuStatic = function(menuOption) {
		for (let i = 0; i < options.length; i++) {
			const option = options[i];
			if (i == menuOption) {
				d.setFg('red');
				d.draw('>', logoX - 2, optionsY + 2 * (menuOption));
			}
			else d.setFg('white');
			d.draw(option, logoX, optionsY + 2 * i);
		}
	}
	this.drawMenuDynamic = function(menuOption, prevMenuOption) {
		const y = optionsY + 2 * menuOption;
		const prevY = optionsY + 2 * prevMenuOption;
		d.setFg('red');
		d.draw('> ' + options[menuOption], logoX - 2, y);
		d.draw(' ', logoX - 2, prevY);
		d.setFg('white');
		d.draw(options[prevMenuOption], logoX, prevY);
	}
	this.drawMenuSelection = function(menuOption) {
		animateSelection(options[menuOption], logoX, optionsY + 2 * menuOption, 250);
		for (let i = 0; i < options.length; i++) {
			if (i != menuOption) dissolve(options[i].length, logoX, optionsY + 2 * i, 125);
		}
	}

	this.drawLocalStatic = function() {
		const squareElements = d.squareElements['thin'];
		d.setFg('white');
		d.draw(squareElements['h'].repeat(8), logoX + 10, optionsY);
		stdout.write(squareElements['tr']);
		d.draw(squareElements['v'], logoX + 18, optionsY + 1);
		d.draw(squareElements['bl'], logoX + 18, optionsY + 2);
		stdout.write(squareElements['h'].repeat(8));
	}

	// ONLINE //

	const onlineOptions = ['SERVER ADDRESS', 'YOUR NAME', 'CONNECT'];
	let cursor = { x: 0, y: 0, visible: false, active: true};
	let cursorBlink;
	function moveCursor(x, y) {
		d.draw(' ', cursor.x, cursor.y);
		cursor.x = x;
		cursor.y = y;
		if (cursor.visible && cursor.active) {
			d.setFg('red');
			d.draw('█', x, y);
		}
	}
	this.clearCursor = function() {
		clearInterval(cursorBlink);
		d.draw(' ', cursor.x, cursor.y);
		cursor.active = false;
	}
	function drawBufferContnet(contentArray, x, y, selected) {
		stdout.cursorTo(x, y);
		if (selected) d.setFg('red');
		else d.setFg('white');
		if (contentArray.length > 0) contentArray.forEach(char => stdout.write(char));
		else
			if (!selected) stdout.write('...');
			else stdout.write('   ');
	}
	this.drawOnlineStatic = function(onlineOption, onlineBuffer, showConnect) {
		cursorBlink = setInterval(() => {
			cursor.visible = !cursor.visible;
			if (cursor.visible && cursor.active) {
				d.setFg('red');
				d.draw('█', cursor.x, cursor.y);
			} else
				d.draw(' ', cursor.x, cursor.y);
		}, 600);
		const selectedY = optionsY + 3 * onlineOption;
		for (let i = 0; i < onlineOptions.length - 1; i++) {
			const option = onlineOptions[i];
			const y = optionsY + 3 * i;
			if (i == onlineOption) {
				d.setFg('red');
				d.draw('>', logoX - 2, selectedY);
			} else
				d.setFg('white');
			d.draw(option, logoX, y);
			drawBufferContnet(onlineBuffer[i], logoX, y + 1, (i == onlineOption));
		}
		if (onlineOption < onlineBuffer.length)
			cursor.active = true;
			moveCursor(logoX + onlineBuffer[onlineOption].length, selectedY + 1);
		if (showConnect) this.toggleConnectButton(true, false);
	}
	this.drawOnlineDynamic = function(option, prevOption, onlineBuffer) {
		const y = optionsY + 3 * option;
		const prevY = optionsY + 3 * prevOption;
		d.setFg('red');
		d.draw('> ' + onlineOptions[option], logoX - 2, y);
		if (option < onlineOptions.length - 1) {
			drawBufferContnet(onlineBuffer[option], logoX, y + 1, true);
			cursor.active = true;
			moveCursor(logoX + onlineBuffer[option].length, y + 1);
		} else {
			cursor.active = false;
			d.draw(' ', cursor.x, cursor.y);
		}
		if (prevOption < onlineOptions.length - 1) {
			d.setFg('white');
			drawBufferContnet(onlineBuffer[prevOption], logoX, prevY + 1, false);
		} else {
			d.setFg('cyan');
		}
		d.draw('  ' + onlineOptions[prevOption], logoX - 2, prevY);
	}
	this.drawOnlineBuffer = function(textChange) {
		const x = logoX + textChange.stringIndex;
		const y = optionsY + 3 * textChange.index + 1;
		if (textChange.adding) {
			moveCursor(cursor.x + 1, cursor.y);
			d.setFg('red');
			d.draw(textChange.char, x, y);
		} else {
			d.draw(' ', x, y);
			moveCursor(cursor.x - 1, cursor.y);
		}
	}
	this.toggleConnectButton = function(show, animate) {
		if (show) {
			d.setFg('cyan');
			if (animate) dissolve(7, logoX, optionsY + 6, 200, 'CONNECT', 'cyan');
			else d.draw('CONNECT', logoX, optionsY + 6);
		} else
			if (animate) dissolve(7, logoX, optionsY + 6, 200);
			else d.draw('       ', logoX, optionsY + 6);
	}
	this.drawOnlineSelection = function(onlineOption) {
		animateSelection(onlineOptions[onlineOption], logoX, optionsY + 3 * onlineOption, 250);
	}
	this.cancelOnlineSelection = function() {
		clearInterval(moveRight);
	}
	let loadingDots = [];
	let dotObjects = [];
	let loadingDotsActive = false;
	this.drawConnectionLoading = function() {
		loadingDotsActive = true;
		let increment = 0;
		function drawLoadingDot(x, y, draw) {
			d.setFg('red');
			const char = draw ? '.' : ' ';
			d.draw(char, x, y);
		}
		function makeLoadingDot() {
			if (increment == 3 || !loadingDotsActive) clearInterval(makeLoadingDots);
			else {
				const x = logoX + increment;
				const y = optionsY + 6;
				drawLoadingDot(x, y, true);
				dotObjects.push({ x: x, y: y, visible: true, active: true });
				const index = increment;
				let loadingDot = setInterval(() => {
					let dot = dotObjects[index];
					dot.visible = !dot.visible;
					drawLoadingDot(dot.x, dot.y, (dot.visible && loadingDotsActive));
				}, 1500);
				loadingDots.push(loadingDot);
				increment++;
			}
		}
		const makeLoadingDots = setInterval(makeLoadingDot, 500);
	}
	this.clearConnectionLoading = function(drawOverDots) {
		loadingDotsActive = false;
		for (dotLoop of loadingDots) clearInterval(dotLoop);
		if (drawOverDots) d.draw('   ', dotObjects[0].x, dotObjects[0].y);
		dotObjects = [];
	}

	this.clearOnline = function(onlineOption, onlineBuffer) {
		for (let i = 0; i < onlineOptions.length; i++) {
			const option = onlineOptions[i];
			const y = optionsY + 3 * i;
			if (i == onlineOption) d.draw(' '.repeat(option.length + 2), logoX - 2, y);
			else d.draw(' '.repeat(option.length), logoX, y);
			if (i < onlineBuffer.length) {
				const bufferLength = onlineBuffer[i].length;
				const bufferClear = ' '.repeat(bufferLength > 0 ? bufferLength : 3);
				d.draw(bufferClear, logoX, y + 1);
			}
		}
		this.clearCursor();
		this.hideConnectionError();
		if (loadingDotsActive) this.clearConnectionLoading();
	}

	this.connectionMessageStage = null;
	const connectionProgessMessages = ['Connecting', 'Press ESC to cancel'];
	let connectionTimeouts = [];
	this.showConnectingMessage = function(messageIndex, delay) {
		const message = connectionProgessMessages[messageIndex];
		const y = optionsY + 3 * onlineOptions.length - 1;
		connectionTimeouts.push(setTimeout(() => {
			d.setFg('red');
			d.draw(message, logoX, y);
		}, delay));
		this.connectionMessageStage = messageIndex;
	}
	this.hideConnectingMessage = function(messageIndex) {
		const message = connectionProgessMessages[messageIndex];
		const y = optionsY + 3 * onlineOptions.length - 1;
		d.draw(' '.repeat(message.length), logoX, y);
		for (let timeout of connectionTimeouts)
			clearTimeout(timeout);
	}
	let connectionError = '';
	this.showConnectionError = function(message) {
		connectionError = message;
		d.setFg('red');
		d.draw(message, logoX, optionsY + 8);
	}
	this.hideConnectionError = function() {
		const errorLength = connectionError.length;
		if (errorLength > 0) {
			d.draw(' '.repeat(errorLength), logoX, optionsY + 8);
		} else return;
	}
	this.debugOnlineBuffer = function(buffer, textChange) {
		d.setFg('white');
		stdout.cursorTo(1,1);
		console.log(buffer);
		stdout.cursorTo(1, 5);
		console.log(textChange);
	}

	this.drawLobbyStatic = function(lobby, ping) {
		stdout.cursorTo(1,1);
		console.log(lobby);
		console.log('ping: ' + ping + 'ms');
		/*
		d.setFg('white');
		d.draw(playerName, logoX + 40, optionsY);
		*/
	}
}

module.exports = MenuDisplay;
