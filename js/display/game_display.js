const GameDisplay = function(d) {
	this.setSize = function() {

	}
	const game = d.buffer.new(1, 7, 30, 20, 0);
	game.enablePixels();
	const designs = require('./cardDesigns.json');

	const card = {value: 6, suit: 's'};
	const suits = {h: '♥', c: '♣', d: '♦', s: '♠'};
	const suitColors = {h: 'red', c: 'magenta', d: 'red', s: 'magenta'};
	this.drawCard = function(x, y) {
		game.outline('yellow');
		d.buffer.setColor('cyan', 'reset');
		game.draw('┌' + '─'.repeat(17) + '┐', x, y);
		for (let i = 1; i < 11; i++) {
			game.draw('│', x, y + i);
			game.draw('│', x + 18, y + i);
		}
		game.draw('└' + '─'.repeat(17) + '┘', x, y + 11);
		const suitChar = suits[card.suit];
		if (suitChar) {
			d.buffer.setFg(suitColors[card.suit]);
			for (let i = 1; i < 9; i++) {
				game.draw(suitChar, x + 2 * i, y + 1);
				game.draw(suitChar, x + 2 * i, y + 10);
			}
		} else {
			d.buffer.setFg('red');
			game.draw('J O K E R', x + 5, y + 1);
			game.draw('J O K E R', x + 5, y + 10);
		}
		game.pixel.drawGrid(designs[card.value - 1], x + 2, y + 2);
		game.render();
	}
}

module.exports = GameDisplay;
