const GameDisplay = function(d) {
	this.setSize = function() {
		gameX = d.centerWidth(46);
		gameY = d.centerHeight(32);
		lobbyX = gameX - 50;
	}
	let gameX, gameY, lobbyX;
	this.setSize();
	const game = d.buffer.new(gameX, gameY, 46, 32, 'game', 1);
	game.enablePixels();


	const design = require('./cardDesigns.json');
	// Make b&w version of joker face
	const jokerFace = design.joker.face;
	const bwJokerFace = [];
	for (let i = 0; i < jokerFace.length; i++) {
		const row = [];
		for (let j = 0; j < jokerFace[i].length; j++) {
			row.push(jokerFace[i][j] ? 1 : 0);
		}
		bwJokerFace.push(row);
	}
	design.joker.bwFace = bwJokerFace;

	const suitColorMap = {h: 2, c: 1, d: 2, s: 1};
	this.drawCardArea = function() {
		const card = [];
		const topRow = [0];
		for (let i = 0; i < 44; i++) topRow.push(6);
		topRow.push(0);
		card.push(topRow);
		const secondRow = [6,6];
		for (let i = 0; i < 41; i++) secondRow.push(8);
		secondRow.push(6,6,6);
		card.push(secondRow);
		for (let i = 0; i < 59; i++) {
			const row = [6];
			for (let i = 0; i < 43; i++) row.push(8);
			row.push(6,6);
			card.push(row);
		}
		card.push(secondRow, Array(46).fill(6), topRow);
		game.pixel.draw(card, 0, 0);
		game.pixel.apply();
	}
	const rotateGrid = function(grid) {
		const output = [];
		const bottom = grid.length - 1;
		for (let i = bottom; i >= 0; i--) {
			const row = [];
			const end = grid[i].length - 1;
			for (let j = end; j >= 0; j--) {
				row.push(grid[i][j]);
			}
			output.push(row);
		}
		return output;
	}
	this.drawCard = function(value, suit) {
		game.pixel.fillArea(3, 3, 39, 57, 'white');
		if (value == 1) { // Joker
			const joker = design.joker;
			const type = Math.floor(Math.random() * 2) ? 'colored' : 'bw';
			game.pixel.draw(joker.text, 3, 3);
			if (type == 'colored')
				game.pixel.draw(joker.face, 9, 8);
			else game.pixel.draw(joker.bwFace, 9, 8);
			game.pixel.draw(rotateGrid(joker.text), 38, 31);
		} else {
			const valueGrid = design.values[value - 2];
			const valueOutput = [];
			for (let i = 0; i < valueGrid.length; i++) {
				valueOutput.push([]);
				for (let j = 0; j < valueGrid[i].length; j++)
					if (valueGrid[i][j]) valueOutput[i].push(suitColorMap[suit]);
					else valueOutput[i].push(8);
			}
			const smallSuit = design.smallSuits[suit];
			// Top right corner
			game.pixel.draw(valueOutput, 3, 3);
			game.pixel.draw(smallSuit, 3, 9);
			if (value < 11) { // Number cards
				for (let map of design.maps[value - 2]) {
					let y = map.y;
					let bigSuit = design.bigSuits[suit];
					if (map.inverted) {
						y--;
						bigSuit = rotateGrid(bigSuit);
					}
					game.pixel.draw(bigSuit, map.x, y);
				}
			} else if (value < 14) { // Face card
				// Put suit behind faces
				// let bigSuit = design.bigSuits[suit];
				// game.pixel.draw(bigSuit, 11, 10);
				// bigSuit = rotateGrid(bigSuit);
				// game.pixel.draw(bigSuit, 25, 43);
				// Draw face design
				const face = design.faces[value - 11][suit];
				game.pixel.draw(face, 9, 8);
				game.pixel.draw(rotateGrid(face), 9, 31);
			} else {
				game.pixel.draw(design.aceSuits[suit], 16, 25);
			}
			// Lower right corner
			game.pixel.draw(rotateGrid(valueOutput), 37, 55);
			game.pixel.draw(rotateGrid(smallSuit), 37, 48);
		}
		game.pixel.apply();
		game.render();
	}

	const lobby = d.buffer.new(lobbyX, gameY, 40, 32, 'game');

	this.drawLobby = function() {
		lobby.outline('green');
		lobby.render();
	}

	this.moveBuffers = function() {
		game.move(gameX, gameY);
	}
}

module.exports = GameDisplay;
