const Controller = function() {
	this.update = function(key, shift = false, ctrl = false) {
		this.esc = this.left = this.right = this.up = this.down = this.tab = this.enter = false;
		this.space = this.backspace = this.delete = this.alphaNum = false;
		this.selectAll = this.copy = this.paste = this.home = this.end = false;
		switch (key) {
			case 'escape' : this.esc = true; break;
			case 'left' : this.left = true; break;
			case 'right' : this.right = true; break;
			case 'up' : this.up = true; break;
			case 'down' : this.down = true; break;
			case 'tab' : this.tab = true; break;
			case 'return' : this.enter = true; break;
			case 'space' : this.space = true; break;
			case 'backspace' : this.backspace = true; break;
			case 'delete' : this.delete = true; break;
			case 'home' : this.home = true; break;
			case 'end' : this.end = true; break;
		}
		if (key != undefined && key.length == 1) {
			let charCode = key.charCodeAt(0);
			if (ctrl)
				switch (key) {
					case 'a' : this.selectAll = this.onlineOption; return true;
					case 'c' : this.copy = this.onlineOption; return true;
					case 'v' : this.paste = this.onlineOption; return true;
					default: return false;
				}
			else {
				if (charCode >= 97 && charCode <= 122 && shift)
					key = key.toUpperCase();
				this.alphaNum = key;
			}
		}
		return true;
	}
	this.update();

	this.screen = 'menu';
	this.menuOption = 0;
	this.prevMenuOption = 0;
	// this.currentMenu = 'main';
	// this.menus = ['local', 'online', 'settings'];
	this.menu = function() {
		const command = {};
		this.prevMenuOption = this.menuOption;
		if (this.up || this.down) {
			this.menuOption = cycle(this.menuOption, 2, this.down);
			return 'select';
		}
		if (this.enter) return 'enter';
		if (this.esc) return 'quit';
	}
	function cycle(number, max, up = true) {
		const end = up * max;
		const start = max - end;
		if (number == end) number = start;
		else number = number - (2 * !up) + 1;
		return number;
	}

	// this.onlineStage = 0;
	this.onlineOption = 0;
	this.onlineBuffer = [[],[]];
	this.cursor = {bufferIndex: 0, textIndex: 0};
	this.cursorIndex = 0;
	this.allFieldsFilled = false;
	let lastOnlineOptionsIndex = this.onlineBuffer.length - 1; // Include cycling through the connect button
	this.online = function() {
		if (this.up || this.down || this.tab) {
			this.onlineOption = cycle(this.onlineOption, lastOnlineOptionsIndex, !this.up);
			this.cursor.bufferIndex = this.onlineOption;
			if (this.onlineOption < this.onlineBuffer.length)
				this.cursorIndex = this.onlineBuffer[this.onlineOption].length;
			return 'select';
		} else if (this.onlineOption < this.onlineBuffer.length) {
			const charArray = this.onlineBuffer[this.onlineOption];
			let textChange = false;
			if (this.alphaNum) {
				charArray.splice(this.cursorIndex, 0, this.alphaNum);
				this.cursorIndex++;
				textChange = true;
			} else if (this.space) {
				charArray.push(' ');
				this.cursorIndex = charArray.length;
				textChange = true;
			} else if (this.backspace) {
				if (charArray.length > 0 && this.cursorIndex > 0) {
					charArray.splice(this.cursorIndex - 1, 1);
					this.cursorIndex--;
					textChange = true;
				}
			} else if (this.delete) {
				if (charArray.length > 0 && this.cursorIndex < charArray.length) {
					charArray.splice(this.cursorIndex, 1);
					textChange = true;
				}
			} else if (this.left) {
				if (this.cursorIndex > 0) {
					this.cursorIndex--;
					return 'select';
				}
			} else if (this.right) {
				if (this.cursorIndex < this.onlineBuffer[this.onlineOption].length) {
					this.cursorIndex++;
					return 'select';
				}
			} else if (this.home) {
				this.cursorIndex = 0;
				return 'select';
			} else if (this.end) {
				this.cursorIndex = this.onlineBuffer[this.onlineOption].length;
				return 'select';
			}
			if (textChange) {
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
				return 'textChange';
			}
		} else if (this.enter) {
			return 'connect';
		}
	}
	this.handleScreen = function() {
		// if (screen == 'menu') return this.handleMenu();
		return this[this.screen]();
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
