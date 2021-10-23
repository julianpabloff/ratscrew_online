const Controller = function() {
	this.update = function(key, shift) {
		this.esc = this.left = this.right = this.up = this.down = this.enter = false;
		this.backspace = this.alphaNum = false;
		switch (key) {
			case "escape" : this.esc = true; break;
			case "left" : this.left = true; break;
			case "right" : this.right = true; break;
			case "up" : this.up = true; break;
			case "down" : this.down = true; break;
			case "return" : this.enter = true; break;
			case "backspace" : this.backspace = true; break;
		}
		if (key != undefined && key.length == 1) {
			let charCode = key.charCodeAt(0);
			// console.log(charCode);
			if (charCode >= 97 && charCode <= 122 && shift)
				key = key.toUpperCase();
			this.alphaNum = key;
			// console.log(this.alphaNum);
		}
	}
	this.update();

	this.menuOption = 0;
	this.prevMenuOption = 0;
	this.currentMenu = 'main';
	this.menus = ['local', 'online', 'settings'];
	this.handleMenu = function() {
		this.prevMenuOption = this.menuOption;
		if (this.up) {
			if (this.menuOption == 0) this.menuOption = 2;
			else this.menuOption--;
		} else if (this.down) {
			if (this.menuOption == 2) this.menuOption = 0;
			else this.menuOption++;
		}
	}

	this.onlineBuffer = {
		address: [],
		name: [],
	};
	let activeOnlineField = 'address';
	this.handleOnline = function() {
		if (activeOnlineField != 'none') {
			if (this.alphaNum) this.onlineBuffer[activeOnlineField].push(this.alphaNum);
			else if (this.backspace) this.onlineBuffer[activeOnlineField].pop();
		}
	}

	this.addPlayerControls = function(players) {
		for (let p = 0; p < players.length; p++) {
			players[p].controller = new PlayerController(players[p].controls);
		}
	}

	this.updatePlayerControls = function(players, key) {
		for (let p = 0; p < players.length; p++) {
			players[p].controller.update(key);
		}
	}
}

const PlayerController = function(controls) {
	this.controls = controls;
	this.flip = this.slap = false;

	this.update = function(key) {
		this.flip = this.slap = false;
		switch (key) {
			case this.controls.flip : this.flip = true; break;
			case this.controls.slap : this.slap = true; break;
		}
	}
}

module.exports.Controller = Controller;
module.exports.PlayerController = PlayerController;
