const MenuDisplay = function(d) {
	
	let stdout = process.stdout;

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
	const options = ['LOCAL', 'ONLINE', 'SETTINGS'];

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

	this.drawMenuStatic = function(menuOption) {
		for (let i = 0; i < options.length; i++) {
			const option = options[i];
			if (i == menuOption) {
				d.setFg('red');
				d.draw('>', logoX - 2, optionsY + 2 * (menuOption));
			}
			else d.setFg('white');
			// d.draw(option, d.centerString(option), optionsY + 2 * i);
			// d.draw(option, d.centerWidth(8), optionsY + 2 * i);
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

	this.animateSelection = async function(menuOption) {
		d.setFg('red');
		const duration = 250;
		const option = options[menuOption];
		const distance = option.length + 3;
		let position = 0;
		function drawAnimation() {
			if (position == distance) {
				d.draw(' ', (logoX - 2) + position, optionsY + 2 * menuOption);
				clearInterval(moveRight);
			} else {
				d.draw(' > ', (logoX - 2) + position, optionsY + 2 * menuOption);
				position++;
			}
		}
		function dissolve(optionIndex) {
			const width = options[optionIndex].length;
			let positions = [];
			let sequence = [];
			for (let i = 0; i < width; i++) {
				positions.push({index: i, selected: false});
			}
			// d.setFg('white');
			// stdout.cursorTo(1,1);
			// console.log(positions);
			for (let i = width; i >= 1; i--) {
				let random = Math.floor(Math.random() * (i)) + 1;
				// console.log(i, random);
				let count = 0;
				for (let j = 0; j < width; j++) {
					if (positions[j].selected == false) count++;
					if (count == random) {
						positions[j].selected = true;
						sequence.push(j);
						break;
					}
				}
			}
			// console.log(sequence);
			let increment = 0;
			function dissolveString() {
				if (increment == width) clearInterval(dissolveInterval);
				else {
					d.draw(' ', logoX + sequence[increment], optionsY + 2 * optionIndex);
					increment++;
				}
			}
			const dissolveInterval = setInterval(dissolveString, (duration / 2)/width);
		}
		const moveRight = setInterval(drawAnimation, Math.floor(duration/distance));
		for (let i = 0; i < options.length; i++) {
			if (i != menuOption) dissolve(i);
		}
		const nextScreen = setTimeout(() => {
			switch (menuOption) {
				case 0: this.drawLocalStatic(); break;
				case 1: this.drawOnlineStatic(); break;
				default: return;
			}
		}, duration);
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

	this.drawOnlineStatic = function() {
		d.setFg('white');
		d.draw('Server Address', logoX, optionsY);
	}
	this.drawOnlineBuffer = function(buffer) {
	}
	this.debugOnlineBuffer = function(buffer) {
		d.setFg('white');
		stdout.cursorTo(1,1);
		console.log(buffer);
	}
}

module.exports = MenuDisplay;
