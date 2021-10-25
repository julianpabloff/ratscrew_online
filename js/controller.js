const Controller = function() {
	this.update = function(key, shift) {
		this.esc = this.left = this.right = this.up = this.down = this.tab = this.enter = false;
		this.space = this.backspace = this.alphaNum = false;
		switch (key) {
			case "escape" : this.esc = true; break;
			case "left" : this.left = true; break;
			case "right" : this.right = true; break;
			case "up" : this.up = true; break;
			case "down" : this.down = true; break;
			case "tab" : this.tab = true; break;
			case "return" : this.enter = true; break;
			case "space" : this.space = true; break;
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

	this.onlineStage = 0;
	// this.onlineBuffer = [
	// 	{ name: 'Server Address', content: [] },
	// 	{ name: 'Your Name', content: [] },
	// ];
	this.onlineBuffer = [[],[]];
	this.onlineOption = 0;
	this.allFieldsFilled = false;
	let lastOnlineOptionsIndex = this.onlineBuffer.length - 1; // Include cycling through the connect button
	this.handleOnline = function() {
		if (this.onlineStage == 0) {
			this.textChange = null;
			if (this.onlineOption < this.onlineBuffer.length) {
				const charArray = this.onlineBuffer[this.onlineOption];
				if (this.alphaNum) {
					this.textChange = {adding: true, index: this.onlineOption, stringIndex: charArray.length, char: this.alphaNum};
					charArray.push(this.alphaNum);
				} else if (this.space) {
					this.textChange = {adding: true, index: this.onlineOption, stringIndex: charArray.length, char: ' '};
					charArray.push(' ');
				}else if (this.backspace && charArray.length > 0) {
					this.textChange = {adding: false, index: this.onlineOption, stringIndex: charArray.length - 1, char: ' '};
					charArray.pop();
				}
				this.allFieldsFilled = true;
				for (let textArray of this.onlineBuffer) {
					if (textArray.length == 0) {
						this.allFieldsFilled = false;
						break;
					}
				}
				const input = this.onlineBuffer[0].join('');
				const match = [...input.matchAll(/[^:]+:\d+/g)][0];
				if (input != match) this.allFieldsFilled = false;
				if (this.allFieldsFilled) lastOnlineOptionsIndex = this.onlineBuffer.length;
				else lastOnlineOptionsIndex = this.onlineBuffer.length - 1;
			}
			if (this.up)
				if (this.onlineOption == 0) this.onlineOption = lastOnlineOptionsIndex;
				else this.onlineOption--;
			else if (this.down || this.tab)
				if (this.onlineOption == lastOnlineOptionsIndex) this.onlineOption = 0;
				else this.onlineOption++;
		} else if (this.onlineStage == 1) {
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
