const clipboard = require('native-clip');

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
					case 'a' : this.selectAll = true; return true;
					case 'c' : this.copy = true; return true;
					case 'v' : this.paste = true; return true;
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
	this.menuUpdate = function() {
		const command = {};
		this.prevMenuOption = this.menuOption;
		if (this.up || this.down) {
			this.menuOption = cycle(this.menuOption, 2, this.down);
			return 'update';
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
	this.online = {
		option: 0,
		buffer: [[],[]],
		cursorIndex: 0,
		selectAll: false,
		filled: false
	};
	let lastOnlineOptionsIndex = this.online.buffer.length - 1; // Include cycling through the connect button
	this.resetForm = function() {
		this.online.cursorIndex = this.online.buffer[0].length;
		this.online.option = 0;
	}
	this.onlineUpdate = function() {
		if (this.esc) return 'quit';
		if (this.up || this.down || this.tab) {
			this.online.option = cycle(this.online.option, lastOnlineOptionsIndex, !this.up);
			if (this.online.option < this.online.buffer.length)
				this.online.cursorIndex = this.online.buffer[this.online.option].length;
			this.online.selectAll = false;
			return 'update';
		} else if (this.online.option < this.online.buffer.length) {
			let charArray = this.online.buffer[this.online.option];
			let textChange = false;
			if (this.alphaNum || this.space) {
				const char = this.space ? ' ' : this.alphaNum;
				if (!this.online.selectAll) {
					if (charArray.length < 25) {
						charArray.splice(this.online.cursorIndex, 0, char);
						this.online.cursorIndex++;
					}
				} else {
					this.online.buffer[this.online.option] = [char];
					this.online.cursorIndex = 1;
					this.online.selectAll = false;
				}
				textChange = true;
			} else if (this.backspace || this.delete) {
				if (charArray.length > 0) {
					if (this.online.selectAll) {
						this.online.buffer[this.online.option] = [];
						this.online.cursorIndex = 0;
						this.online.selectAll = false;
					} else if (this.backspace) {
						if (this.online.cursorIndex > 0) {
							charArray.splice(this.online.cursorIndex - 1, 1);
							this.online.cursorIndex--;
						}
					} else if (this.delete) {
						if (this.online.cursorIndex < charArray.length) {
							charArray.splice(this.online.cursorIndex, 1);
							textChange = true;
						}
					}
					textChange = true;
				}
			} else if (this.left) {
				if (this.online.cursorIndex > 0)
					this.online.cursorIndex--;
				this.online.selectAll = false;
				return 'update';
			} else if (this.right) {
				if (this.online.cursorIndex < this.online.buffer[this.online.option].length)
					this.online.cursorIndex++;
				this.online.selectAll = false;
				return 'update';
			} else if (this.home) {
				this.online.cursorIndex = 0;
				this.online.selectAll = false;
				return 'update';
			} else if (this.end) {
				this.online.cursorIndex = this.online.buffer[this.online.option].length;
				this.online.selectAll = false;
				return 'update';
			} else if (this.selectAll && charArray.length > 0) {
				this.online.selectAll = true;
				return 'update';
			} else if (this.copy && this.online.selectAll) {
				const input = charArray.join('');
				clipboard.write(input);
				this.online.selectAll = false;
				return 'update';
			} else if (this.paste) {
				const text = clipboard.read();
				if (text != null) {
					const clipCharArray = [];
					for (const char of text) clipCharArray.push(char);
					if (this.online.selectAll && clipCharArray.length <= 25) {
						this.online.buffer[this.online.option] = clipCharArray;
						this.online.cursorIndex = clipCharArray.length;
						this.online.selectAll = false;
					}
					else if (charArray.length + clipCharArray.length <= 25) {
						charArray.splice(this.online.cursorIndex, 0, ...clipCharArray);
						this.online.cursorIndex += clipCharArray.length;
					}
					textChange = true;
				}
			}
			if (textChange) {
				const temp = this.online.filled;
				this.online.filled = true;
				for (let textArray of this.online.buffer) {
					if (textArray.length == 0) {
						this.online.filled = false;
						break;
					}
				}
				const input = this.online.buffer[0].join('');
				const match = [...input.matchAll(/[^:]+:\d+/g)][0];
				if (input != match) this.online.filled = false;
				if (this.online.filled) lastOnlineOptionsIndex = this.online.buffer.length;
				else lastOnlineOptionsIndex = this.online.buffer.length - 1;
				return temp != this.online.filled ? 'toggleConnect' : 'update';
			}
		} else if (this.enter) return 'connect';
	}
	this.connectingUpdate = function() {
		if (this.esc) return 'cancel';
	}
	this.lobbyUpdate = function() {
		if (this.esc) return 'escape';
		else if (this.enter) return 'ready';
	}
	this.gameUpdate = function() {
		if (this.esc) return 'escape';
	}
	this.handleScreen = function() {
		// if (screen == 'menu') return this.handleMenu();
		return this[this.screen + 'Update']();
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
