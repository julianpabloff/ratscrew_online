const Display = function() {

	let stdout = process.stdout;
	this.draw = function(string, x, y) {
		stdout.cursorTo(x, y);
		stdout.write(string);
	}

	this.clear = () => stdout.write('\x1b[2J');
	this.init = function() {
		this.clear();
		stdout.write('\x1b[?25l');
	}
	this.setBold = function(bold) {
		if (bold) stdout.write('\x1b[1m');
		else stdout.write('\x1b[22m');
	}

	const colors = {
		fg : { black:'\x1b[30m', red:'\x1b[31m', green:'\x1b[32m', magenta:'\x1b[35m', blue:'\x1b[34m', cyan:'\x1b[36m', white:'\x1b[37m', reset:'\x1b[0m' },
		bg : { black:'\x1b[40m', red:'\x1b[41m', green:'\x1b[42m', magenta:'\x1b[45m', blue:'\x1b[44m', cyan:'\x1b[46m', white:'\x1b[47m', reset:'\x1b[0m' },
		reset : '\x1b[0m'
	};
	this.setFg = function(colorName) { 
		stdout.write(colors.fg[colorName]);
	}
	this.setBg = function(colorName) { 
		stdout.write(colors.bg[colorName]);
		background = colors.bg[colorName];
	}
	this.setColor = function(fg, bg) {
		this.setFg(fg); this.setBg(bg);
	}
	this.squareElements = {
		none: {tl: ' ', tr: ' ', bl: ' ', br: ' ', h: ' ', v: ' '},
		thin: {tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│'},
		// thick: {tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│'}
	};

	this.resize = function() {
		this.rows = stdout.rows;
		this.columns = stdout.columns;
		rows = stdout.rows;
		columns = stdout.columns;
		centerRow = Math.floor(rows / 2);
		centerColumn = Math.floor(columns / 2);
		cardY = centerRow - cardHeight / 2;
		cardCenter = centerColumn - cardWidth / 2;
		cardLeft = Math.floor(columns * 0.2);
		cardRight = columns - Math.floor(columns * 0.2) - 14; 
		// Maximum distance from center pile is 3 card widths
		if (cardCenter - cardLeft > cardWidth * 3) cardLeft = cardCenter - cardWidth * 3;
		if (cardRight - cardCenter > cardWidth * 3) cardRight = cardCenter + cardWidth * 3;
		// Minimum distance from center pile is 1.5 card widths
		if (cardCenter - cardLeft < cardWidth * 1.5) cardLeft = cardCenter - cardWidth - 5;
		if (cardRight - cardCenter < cardWidth * 1.5) cardRight = cardCenter + cardWidth + 5;
	}

	let cardHeight = 10; let cardWidth = 14;
	let rows, columns, centerRow, centerColumn, cardY, cardCenter, cardLeft, cardRight;
	this.resize();

	this.centerString = function(string) {
		return Math.floor(this.columns/2 - string.length/2);
	}
	this.centerWidth = function(width) {
		return Math.floor(this.columns/2 - width/2);
	}
	this.centerHeight = function(height) {
		return Math.floor(this.rows/2 - height/2);
	}

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
	const textLogo = ['┌─────────────────┐', '│ E Q Y P T I A N │', '│ R A T S C R E W │', '└─────────────────┘'];

	const cardVals = [null,'JOKER','2','3','4','5','6','7','8','9','10','J','Q','K','A'];
	const cardSuits = {
		'h' : ['  _  _  ', ' / \\/ \\ ', ' \\    / ', '  \\  /  ', '   \\/   '],
		'c' : ['   __   ', ' _|  |_ ', '[      ]', '[__  __]', '   /\\   '],
		'd' : ['        ', '   /\\   ', '  /  \\  ', '  \\  /  ', '   \\/   '],
		's' : ['   /\\   ', '  /  \\  ', ' /    \\ ', ' \\_/\\_/ ', '   /\\   '],
		'j' : ['  ____  ', ' /\\  _\\ ', '/ 0  0 \\', '\\ \\__/ /', ' \\____/ '],
	}
	const cardBox = ['┌────────────┐', '│            │', '└────────────┘'];

	const centerString = function(string) { return Math.floor(columns/2) - Math.floor(string.length/2) }

	const gameover = [
		' ╔══════════════════════════════════════════════════════════════════════╗ ',
		' ║                                                                      ║ ',
		' ║  ██████  ██████  ████████  ██████    ██████  ██  ██  ██████  ██████  ║ ',
		' ║  ██  ▄▄  ██  ██  ██ ██ ██  ██▄▄▄▄    ██  ██  ██  ██  ██▄▄▄▄  ██  ██  ║ ',
		' ║  ██  ██  ██████  ██ ██ ██  ██▀▀▀▀    ██  ██  ██  ██  ██▀▀▀▀  █████   ║ ',
		' ║  ██████  ██  ██  ██    ██  ██████    ██████   ████   ██████  ██  ██  ║ ',
		' ║                                                                      ║ ',
		' ║              < YES >         Play again?           NO                ║ ',
		' ║                                                                      ║ ',
		' ╚══════════════════════════════════════════════════════════════════════╝ ',
	];

	this.drawBox = function(x,y,w,h) {
		stdout.cursorTo(x,y);
		let borderTop = '';
		for (let i = 0; i < w - 2; i++) borderTop += '─';
		stdout.write('┌' + borderTop + '┐');
		for (let i = 1; i <= h - 2; i++) {
			stdout.cursorTo(x, y + i);
			stdout.write('│');
			stdout.cursorTo(x + w - 1, y + i);
			stdout.write('│');
		}
		stdout.cursorTo(x, y + h - 1);
		stdout.write('└' + borderTop + '┘');
	}

	this.drawLogo = function() {
		this.clear();
		if (columns >= logo[0].length + logo.length) {
			let offset = Math.floor(logo.length / 2) - 2;
			for (let i = 0; i < logo.length; i++) {
				stdout.cursorTo(centerString(logo[0]) - offset + i - (i > 6) * 4, centerRow - 20 + i);
				//stdout.write(logo[i]);
				// CHARACTER BASED COLOR SCHEME
				let currentChar = '';
				for (let j = 0; j < logo[i].length; j++) {
					if (logo[i][j] != currentChar && logo[i][j]!= ' ') currentChar = logo[i][j];
					if (currentChar == '\\') stdout.write(colors.fg.magenta);
					else if (currentChar == '_') stdout.write(colors.fg.cyan);
					else if (currentChar == '/') stdout.write(colors.fg.red);
					stdout.write(logo[i][j]);
				}
			}
			stdout.write(colors.fg.white);
		} else {
			for (let i = 0; i < textLogo.length; i++) {
				stdout.cursorTo(centerString(textLogo[0]), centerRow - 10 + i);
				stdout.write(textLogo[i]);
			}
		}
	}

	this.moveLogoUp = () => stdout.write('\x1b[r\x1b[M');
	this.moveLogoDown = () => stdout.write('\x1b[r\x1b[D');

	this.drawMenu = function(playerNum) {
		let message = 'How many players?'; let messageX = centerString(message) - 3;
		let messageY = Math.floor(rows/2);;
		for (let i = 0; i < 7; i++) {
			for (let j = 0; j < message.length + 6; j++) {
				stdout.cursorTo(messageX + j, messageY + i);
				stdout.write(' ');
			}
		}
		stdout.cursorTo(centerString(message), messageY + 2);
		stdout.write(message);
		stdout.cursorTo(centerString('<   >'), messageY + 4);
		stdout.write('< ' + playerNum.toString() + ' >');
	}


	let lastCardPos = {x: null, y: null};
	this.drawCard = function(card, x, y) {
		let suit = card.suit;
		let value = cardVals[card.value];

		if (x != lastCardPos.x || y != lastCardPos.y) this.drawCardBox(x, y);
		else this.drawCardBox(x, y);

		//paints the ascii suit artwork
		for (let i = 0; i <= 4; i++) {
			stdout.cursorTo(x + 3, y + 2 + i);
			stdout.write(cardSuits[suit][i]);
		}

		// Stamps the values on the corners
		stdout.cursorTo(x + 2, y + 1);
		stdout.write('     ');
		stdout.cursorTo(x + 2, y + 1);
		stdout.write(value.toString());
		stdout.cursorTo(x + 7, y + 8);
		stdout.write('     ');
		stdout.cursorTo(x + 12 - value.length, y + 8);
		stdout.write(value);
		stdout.cursorTo(0,0);

		lastCardPos = {x: x, y: y};
	}

	this.drawCardBox = function(x, y) {
		for (let i = 0; i < 10; i++) {
			stdout.cursorTo(x, y+i);
			if (i == 0) stdout.write(cardBox[0]);
			else if (i > 0 && i < 9) stdout.write(cardBox[1]);
			else stdout.write(cardBox[2]);
		}
	}

	this.drawCardPile = function(x, y) {
		this.drawCardBox(x,y);
		for (let i = 1; i < 9; i+=2) {
			stdout.cursorTo(x + 1, y+i);
			stdout.write('· · · · · · ');
			stdout.cursorTo(x + 1, y+i+1);
			stdout.write(' · · · · · ·');
		}
	}

	let pilePos = [];
	this.drawTable = function(players) {
		pilePos = [];
		pilePos.push({x: cardLeft, y: cardY});
		if (players.length >= 3) pilePos.push({x: cardCenter, y: cardY - cardHeight - 5});
		pilePos.push({x: cardRight, y: cardY});
		if (players.length == 4) pilePos.push({x: cardCenter, y: cardY + cardHeight + 7});

		for (let p = 0; p < pilePos.length; p++) {
			this.drawCardPile(pilePos[p].x, pilePos[p].y);
			stdout.cursorTo(pilePos[p].x + 3, pilePos[p].y - 4);
			stdout.write('PLAYER ' + (p+1).toString());
		}
	}

	this.updateTopCard = function(topCard) {
		if (topCard != undefined) {
			this.drawCard(topCard, cardCenter, cardY);
			stdout.cursorTo(cardLeft + 3, cardY - 1);
		} else {
			for (let i = 0; i <= 10; i++) {
				stdout.cursorTo(cardCenter, cardY + i);
				stdout.write('              ');
			}
		}
	}

	this.updateStats = function(players, turn, faceChances, winner) {
		let turnChars = [[' ', ' '], ['<', '>']];
		for (let p = 0; p < players.length; p++) {
			if (players[p].hand.length > 5) amount = Math.round(players[p].hand.length * 14 / 54);
			else amount = Math.ceil(players[p].hand.length * 14 / 54);
			stdout.cursorTo(pilePos[p].x, pilePos[p].y - 2);
			for (let i = 1; i <= 14; i++) {
				if (players[p].hand.length > 0) {
					if (i <= amount) stdout.write('█');
					else stdout.write('▒');
				} else stdout.write('░');
			}
			stdout.write(' ' + players[p].hand.length.toString() + ' ');
			stdout.cursorTo(pilePos[p].x + 1, pilePos[p].y - 4);
			stdout.write(turnChars[p == turn ? 1 : 0][0]);
			stdout.cursorTo(pilePos[p].x + 12, pilePos[p].y - 4);
			stdout.write(turnChars[p == turn ? 1 : 0][1]);
		}
		if (!winner) {
			stdout.cursorTo(cardCenter - 3, cardY - 2);
			if (faceChances > 0) stdout.write('     CHANCES: ' + faceChances.toString());
			else stdout.write('                    ');
		} else {
			stdout.cursorTo(cardCenter - 3, cardY - 2);
			stdout.write('PLAYER ' + (Number(turn) + 1).toString() + ' take cards');
		}
	}

	this.drawGameOver = function() {
		let width = gameover[0].length;
		let height = gameover.length;
		let x = centerColumn - Math.floor(width/2);
		let y = centerRow - Math.floor(gameover.length/2);
		for (let i = 0; i < gameover.length; i++) {
			stdout.cursorTo(x, y + i);
			stdout.write(gameover[i]);
		}
		for (let i = 0; i < 2; i++) {
			setTimeout(() => {
				for (let r = 1; r <= rows; r++) {
					for (let c = 1 + i; c <= columns; c += 2) {
						if (r >= y && r <= y + gameover.length && c >= x && c <= x + gameover[0].length - 1) continue;
						stdout.cursorTo(c, r);
						stdout.write(' ');
					}
				}
			}, 200 + 200 * i);
		}
	}

	this.updateGameOver = function(yes) {
		let x = centerColumn - Math.floor(gameover[0].length/2);
		let y = centerRow - Math.floor(gameover.length/2);
		let selectChars = [[' ', ' '], ['<', '>']];

		stdout.cursorTo(x + 16, y + 7);
		stdout.write(selectChars[yes ? 1 : 0][0]);
		stdout.cursorTo(x + 22, y + 7);
		stdout.write(selectChars[yes ? 1 : 0][1]);
		stdout.cursorTo(x + 52, y + 7);
		stdout.write(selectChars[yes ? 0 : 1][0]);
		stdout.cursorTo(x + 57, y + 7);
		stdout.write(selectChars[yes ? 0 : 1][1]);
	}

	this.seeAllCards = function(game) {
		this.clear();
		for (p in game.players) {
			console.log('Player', p, '-', game.players[p].hand.length, 'cards');
			console.log(game.players[p].hand);
		}
		console.log('In Play:');
		console.log(game.inPlay);
		console.log('Turn:', game.turn);
	}

	this.reset = function() {
		pilePos = [];
	}

	this.exit = function() {
		stdout.write('\x1b[?25h\x1b[0m');
		stdout.cursorTo(0,0);
		this.clear();
	}

}

module.exports = Display;
