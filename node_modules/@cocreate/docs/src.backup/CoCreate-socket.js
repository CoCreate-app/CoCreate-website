const WebSocket = require('ws')
const Blob = {};

const location = {};
location.protocol = "";

const CoCreateSocket = {
	sockets : new Map(),
	prefix  : "ws",
	listeners: new Map(),
	messageQueue: new Map(),
	
	saveFileName: '',
	
	globalScope: "",

	setGlobalScope: function(scope) {
		this.globalScope = `${this.prefix}/${scope}`;
	},
	getGlobalScope: function() {
		return this.globalScope;
	},
	
	/**
	 * config: {namespace, room, host}
	 */
	create: function(config) {
		const {namespace, room} = config;
		const key = this.getKey(namespace, room);
		let _this = this;
		let socket;
		if (this.sockets.get(key)) {
			socket = this.sockets.get(key);
			console.log('SOcket already has been register');
			return;
		}
		
		const protocol = location.protocol === 'http:' ? 'ws' : 'wss';

		let socket_url = `${protocol}://${location.host}/${key}`;
		if (config.host) {
			socket_url = `${protocol}://${config.host}/${key}`;
		}
		
		console.log(socket_url)
		
		socket = new WebSocket(socket_url);
		
		socket.onopen = function(event) {
			console.log('created socket: ' + key);
			const messages = _this.messageQueue.get(key) || [];
			console.log(messages)
			messages.forEach(msg => socket.send(JSON.stringify(msg)));
			
			_this.sockets.set(key, socket);
			_this.messageQueue.set(key, []);
		}
		
		socket.onclose = function(event) {
			switch(event.code) {
				case 1000: // close normal
					console.log("websocket: closed");
					break;
				default: 
					_this.destroy(socket, key);
					_this.reconnect(socket, config);
					break;
			}
		}
		
		socket.onerror = function(err) {
			console.log('Socket error');
			_this.destroy(socket, key);
			_this.reconnect(socket, config);
		}
		

		socket.onmessage = function(data) {
			
			try {
				// if (data.data instanceof Blob) {
				// 	_this.saveFile(data.data);
				// 	return;
				// }
				let rev_data = JSON.parse(data.data);
				
				
				const listeners = _this.listeners.get(rev_data.action);
				if (!listeners) {
					return;
				}
				listeners.forEach(listener => {
					listener(rev_data.data, key);
				})
			} catch (e) {
				console.log(e);
			}
		}
	},
	
	/**
	 * 
	 */
	send: function(action, data, room) {
		const obj = {
			action: action,
			data: data
		}
		const key = this.getKeyByRoom(room);
		const socket = this.getByRoom(room);
		
		if (socket) {
			socket.send(JSON.stringify(obj));
		} else {
			if (this.messageQueue.get(key)) {
				this.messageQueue.get(key).push(obj);
			} else {
				this.messageQueue.set(key, [obj]);
			}
		}
	},
	
	sendFile: function(file, room) {
		const socket = this.getByRoom(room);
		if (socket) {
			socket.send(file);
		}
	},

	/**
	 * scope: ns/room
	 */
	listen: function(type, callback) {
		if (!this.listeners.get(type)) {
			this.listeners.set(type, [callback]);
		} else {
			this.listeners.get(type).push(callback);
		}
	},
	
	reconnect: function(socket, config) {
		let _this = this;
		setTimeout(function() {
			console.log('socket: reconnecting....');
			_this.create(config);
		}, 1000)
	},
	
	destroy: function(socket, key) {
		if (socket) {
			socket.onerror = socket.onopen = socket.onclose = null;
			socket.close();
			socket = null;
		}
		
		if (this.sockets.get(key)) {
			this.sockets.delete(key);
		}
	},
	
	getKey: function(namespace, room) {
		let key = `${this.prefix}`;
		if (namespace && namespace != '') {
			if (room &&  room != '') {
				key += `/${namespace}/${room}`;
			} else {
				key +=`/${namespace}`;
			}
		}
		return key;
	},
	
	getByRoom: function(room) {
		let key = this.getKeyByRoom(room)
		return this.sockets.get(key);	
	},
	
	getKeyByRoom: function(room) {
		let key = this.globalScope;
		if (room) {
			key = `${this.prefix}/${room}`;
		}
		return key;		
	},
	
	
	saveFile: function(blob) {
		// const {filename} = window.saveFileInfo;
		
		const file_name = this.saveFileName || 'downloadFile';
		var a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";

        let url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = file_name;
        a.click();
        window.URL.revokeObjectURL(url);

        this.saveFileName = ''
	}	
}

module.exports = CoCreateSocket
