const GameDisplay = function(d) {
	/*

┌───────────┐
│ ♥         │
│           │
│           │
│           │
│           │
│           │
│           │
└───────────┘


	*/
	this.setSize = function() {

	}
	const game = d.buffer.new(1, 7, 30, 20, 0);
	game.enablePixels();
	const designs = require('./cardDesigns.json');

	this.drawCard = function(x, y) {
		game.outline('yellow');
		game.pixel.drawGrid(designs[2], x, y);
		game.render();
	}
}

module.exports = GameDisplay;
