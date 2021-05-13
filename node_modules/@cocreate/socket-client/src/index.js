

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['./common-fun.js'], function(commonFunc) {
        	return factory(commonFunc, window, WebSocket, Blob)
        });
    } else if (typeof module === 'object' && module.exports) {
        let wndObj = {
        	location: {
        		protocol: ""
        	}
        }
        const ws = require("ws")
        const commonFunc = require("./common-fun.js")
    	module.exports = factory(commonFunc, wndObj, ws, null);
    } else {
        // Browser globals (root is window)
        root.returnExports = factory(root["./common-fun.js"], window, WebSocket, Blob);
  }
}(typeof self !== 'undefined' ? self : this, function (commonFunc, wnd, WebSocket, Blob) {

    class CoCreateSocketClient
	{
		constructor(prefix = "crud") {
			this.prefix = prefix || "crud";
			this.sockets = new Map();
			this.listeners = new Map();
			this.messageQueue =  new Map();
			this.saveFileName =  '';
			this.globalScope =  "";
		}
	
		setGlobalScope(scope) {
			this.globalScope = `${this.prefix}/${scope}`;
		}
		
		getGlobalScope() {
			return this.globalScope;
		}
		
		/**
		 * config: {namespace, room, host}
		 */
		create (config) {
			
			const {namespace, room} = config;
			const key = this.getKey(namespace, room);
			let _this = this;
			if (namespace) {
				this.setGlobalScope(namespace)
			}
			
			let socket;
			if (this.sockets.get(key)) {
				socket = this.sockets.get(key);
				console.log('SOcket already has been register');
				return;
			}
			
			let w_protocol = wnd.location.protocol;		
			if (wnd.location.protocol === "about:") {
				w_protocol = wnd.parent.location.protocol;
				if (!config.host) {
					config.host = wnd.parent.location.host;
				}
			}
			let protocol = w_protocol === 'http:' ? 'ws' : 'wss';
			
			const port = config.port ? config.port : 8088;
			
			let socket_url = `${protocol}://${wnd.location.host}:${port}/${key}`;
			
			if (config.host) {
				if (config.host.includes("://")) {
					socket_url = `${config.host}/${key}`;
				} else {
					if (config.host.includes(":")) {
						socket_url = `${protocol}://${config.host}/${key}`;
					} else {
						socket_url = `${protocol}://${config.host}:${port}/${key}`;	
					}
				}
			}
			try {
				let token = null;
				if (wnd.localStorage) {
					token = wnd.localStorage.getItem("token");
				}
				socket = new WebSocket(socket_url, token);
			} catch(error) {
				console.log(error)
				return;
			}

			socket.onopen = function(event) {
				const messages = _this.messageQueue.get(key) || [];
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
				_this.destroy(socket, key);
				_this.reconnect(socket, config);
			}
	
			socket.onmessage = function(data) {
				try {
					if (wnd.Blob) {
						if (data.data instanceof Blob) {
							_this.saveFile(data.data);
							return;
						}
					}
					let rev_data = JSON.parse(data.data);

					if (rev_data.data && rev_data.data.event) {
						
						if (wnd.CustomEvent) {
							var event = new wnd.CustomEvent(rev_data.data.event, {
								detail: rev_data.data
							})
							wnd.document.dispatchEvent(event);
							return;
						} else {
							process.emit(rev_data.data.event, rev_data.data)
							return;
						}
						
					}
					let action = rev_data.action;
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
		}
		
		/**
		 * 
		 */
		send (action, data, room) {
			const obj = {
				action: action,
				data: {...data, uid: commonFunc.GenerateUUID()}
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
		}
		
		sendFile (file, room) {
			const socket = this.getByRoom(room);
			if (socket) {
				socket.send(file);
			}
		}
	
		/**
		 * scope: ns/room
		 */
		listen(type, callback) {
			if (!this.listeners.get(type)) {
				this.listeners.set(type, [callback]);
			} else {
				this.listeners.get(type).push(callback);
			}
		}
		
		reconnect(socket, config) {
			let _this = this;
			setTimeout(function() {
				_this.create(config);
			}, 1000)
		}
		
		destroy(socket, key) {
			if (socket) {
				socket.onerror = socket.onopen = socket.onclose = null;
				socket.close();
				socket = null;
			}
			
			if (this.sockets.get(key)) {
				this.sockets.delete(key);
			}
		}
		
		destroyByKey(key) {
			let socket = this.sockets.get(key) 
			if (socket) {
				this.destroy(socket, key);
			}
		}
		
		getKey(namespace, room) {
			let key = `${this.prefix}`;
			if (namespace && namespace != '') {
				if (room &&  room != '') {
					key += `/${namespace}/${room}`;
				} else {
					key +=`/${namespace}`;
				}
			}
			return key;
		}
		
		getByRoom(room) {
			let key = this.getKeyByRoom(room)
			return this.sockets.get(key);	
		}
		
		getKeyByRoom(room) {
			let key = this.globalScope;
			if (room) {
				key = `${this.prefix}/${room}`;
			}
			return key;		
		}
		
		
		saveFile(blob) {
			if (wnd.document) {
				const file_name = this.saveFileName || 'downloadFile';
				var a = wnd.document.createElement("a");
		        wnd.document.body.appendChild(a);
		        a.style = "display: none";
		
		        let url = window.URL.createObjectURL(blob);
		        a.href = url;
		        a.download = file_name;
		        a.click();
		        wnd.URL.revokeObjectURL(url);
		
		        this.saveFileName = ''
			}
		}
		
		listenAsync(eventname) {
			return new Promise((resolve, reject) => {
				if (wnd.document) { //. browser case
					wnd.document.addEventListener(eventname, function(event) {
					    resolve(event.detail);
					}, { once: true })
				} else { //. node case
					process.once(eventname, (data) => {
						resolve(data)
					})
				}
			})
		}
	}
    return CoCreateSocketClient
}));
