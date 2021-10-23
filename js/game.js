const Game = function() {

	this.state = 0;
	this.cards = [];
	this.size = 54;
	this.suits = ["h", "c", "d", "s"];
	this.values = [2,3,4,5,6,7,8,9,10,11,12,13,14];
	this.players = [];
	this.playerNum = 2;
	this.inPlay = [];
	this.turn = 0;
	this.faceChances = 0;
	this.faceInst = 0;
	this.faceOver = false;

	this.buildDeck = function() {
		for (let suit of this.suits) {
			for (let value of this.values) {
				this.cards.push(new Card(suit, value));
			}
		}
		this.cards.push(new Card("j", 1));
		this.cards.push(new Card("j", 1));
		return this;
	}

	this.shuffle = function() {
		for (let i in this.cards) {
			randomIndex = Math.floor(Math.random() * this.cards.length);
			let temp = this.cards[i];
			this.cards[i] = this.cards[randomIndex];
			this.cards[randomIndex] = temp;
		}
		return this;
	}

	this.addPlayers = function(amount, controls) {
		for (let i = 0; i < amount; i++) {
			this.players.push(new Player(controls[i]));
		}
		return this;
	}

	this.dealCards = function() {
		for (let card of this.cards) {
			this.players[this.turn].hand.push(card);
			this.changeTurn();
		}
		this.turn = 0;
	}

	this.flipCard = function() {
		this.inPlay.push(this.players[this.turn].hand.shift());
		for (let p in this.players) this.players[p].failedSlap = false;
		return this.evalFaceCards();
	}

	this.evalFaceCards = function() {
		let initalTurn = this.turn;
		let topVal = this.inPlay[this.inPlay.length - 1].value;
		this.faceOver = false;
		if (this.faceChances == 0) this.changeTurn();
		if (topVal > 10) {
			this.faceInst = initalTurn;
			if (this.faceChances != 0) this.changeTurn();
			this.faceChances = topVal - 10;
		}
		if (topVal < 11 && this.faceChances > 0) {
			if (this.players[this.turn].hand.length <= 0) this.changeTurn();
			this.faceChances--;
			if (this.faceChances == 0) { this.faceOver = true; return true }
		}
		return false;
	}

	this.changeTurn = function() {
		this.turn++;
		this.turn = this.turn % this.players.length;
		if (this.players[this.turn].inGame == false) this.changeTurn();
		return this;
	}

	this.evalSlap = function(inst) { // inst short for instigator
		let slapValid = false;
		let topVal, secondVal, thirdVal;

		if (this.inPlay.length > 0) topVal = this.inPlay[this.inPlay.length - 1].value;
		if (this.inPlay.length > 1) secondVal = this.inPlay[this.inPlay.length - 2].value;
		if (this.inPlay.length > 2) thirdVal = this.inPlay[this.inPlay.length - 3].value;

		if ((topVal == secondVal || topVal == thirdVal || topVal == 1) && topVal != undefined) slapValid = true;
		if (slapValid) {
			this.takeCards(inst);
			this.faceChances = 0;
			this.faceOver = false;
			return true;
		} else if (this.players[inst].inGame && !this.players[inst].failedSlap && this.inPlay.length > 0) {
			this.inPlay.unshift(this.players[inst].hand.pop());
			this.players[inst].failedSlap = true;
		} else return false;
	}

	this.takeCards = function(p) {
		for (let c = 0; c < this.inPlay.length; c++) {
			this.players[p].hand.push(this.inPlay[c]);
		}
		this.inPlay = [];
		this.turn = p;
	}

	this.over = function() {
		let inPlayCount = 0;
		for (let player of this.players) {
			if (player.hand.length == 0) {
				player.inGame = false;
			} else {
				player.inGame = true;
				inPlayCount += 1;
			}
		}
		if (inPlayCount == 1) return true;
		else return false;
	}

	this.reset = function() {
		this.state = 0;
		// for (let i in this.inPlay) delete this.inPlay[i];
		// for (let p in this.players) delete this.players[p];
		this.players = [];
		// console.log(this.players);
		this.turn = 0;
		this.shuffle();
		this.faceChances = 0;
	}
}

const Card = function(suit, value, x=0, y=0) {
	this.suit = suit;
	this.value = value;
}

const Player = function(controls) {
	this.hand = [];
	this.inGame = true;
	this.failedSlap = false;
	this.controls = controls;
	this.controller = null; // instantiate a PlayerController for each player in controller.js
	this.faceOver = false;
}

module.exports = Game;
