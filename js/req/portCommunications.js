
//portCommunications script
//-unifies Chrome message passing functions
//--port messages can now have callbacks
//--both port and broadcast message listeners are used if the initial function cannot find the sent method

//load only once
if(typeof(Port) == 'undefined'){
	console.log('portCommunications.js load:');
	
	//obj to store all port connections	
	var _connections = {},
		//create the Port function
		Port = function(obj){
			//make sure obj is an {}
			var _objtype = typeof(obj);
			switch(true){
				case((/(string|number|boolean)/).test(_objtype)):
					obj = { name: ''+obj };
				break;
				case(_objtype == 'undefined'):
					obj = {};
				break;
			}//switch
			
			//the debug option
			var doDebug = obj.debug || false,
				//back reference to scope
				_this = this;
			
			//obj for storing port message callbacks
			this.portMsgCallbacks = {};
			//obj for storing port message listeners
			this.portListenerCallbacks = {};
			//obj for storing broadcast message callbacks
			this.broadcastCallbacks = {};
			//obj for storing connected ports, only used by background script
			var connectedPorts = {};
			//reference to the chrome port
			this.actual = false;
			//flag for connection status
			this.connected = false;
			//if this is a script that is listening for port connections (background.js)
			this.isOnConnectListener = false;
			//tab ID for this tab
			//this.tabID = false;
			//port name
			var name = obj.name || 'Background';
			//extension ID
			var extID = obj.id;
			//remove id from obj
			delete obj.id;

			//store the obj
			this.connectObj = obj;
			
			//return all connected ports of specified type (optional)
			this.getConnectedPorts = function(type) {
				//no type was sent, return all ports
				if(typeof(type) == 'undefined') {
					return connectedPorts;
				}//if
				switch(true){
					//if a number which represents the tabid is sent, return the connectedPort object for that tab or false if there isn't one
					case(!!type && typeof(type) == 'number'):
						return connectedPorts[parseInt(type)] || false;
					break;
					//if a string is sent, return only the ports that have a connection with that name
					case(!!type && typeof(type) == 'string'):
						var cPorts = {};
						for(var i in connectedPorts){
							if(!!connectedPorts[i][type]){
								cPorts[i] = connectedPorts[i];
							}//if
						};
						return cPorts;
					break;
					default:
						//if it gets here, then type was neither a string nor a number, or was either blank or 0, return all ports
						return connectedPorts;
					break;
				}//switch
			};
			//connect to the port
			this.connect = function(obj){
				//console.log('pc connect: '+_this.connected);
				//console.debug(obj);
				if(!!checkConnected(true) || !obj){ return false; }
				(!obj.name) ? obj.name = 'portName' : '';
				doConnect(obj,extID);
			};
			//process the connection
			var doConnect = function(_obj,_extID,reconnect){
				//_debug(name+': doConnect extID: '+_extID+' | '+typeof(_extID));
				//_debug(_obj);

				_this.connected = false;
				_this.actual = false;
				if(typeof(_extID) == 'undefined'){
					//_debug('no extID');
					_this.actual = chrome.runtime.connect(_obj);
				} else {
					//_debug('has extID');
					_this.actual = chrome.runtime.connect(_extID, _obj);
				}//if
				
				_this.connected = (!!_this.actual);
				//if the port exists, add the message listener if it does not have it yet
				if(!!_this.actual){
					//console.log(name+': <<<<<<<<<<<<<<<<<< is connected');
					//console.debug(_this.actual);
					if(!_this.actual.onMessage.hasListener(portListener)){
						//console.log(name+': >>>>>>>>>>>>>>>>>>>>> attach port listener:');
						_this.actual.onMessage.addListener(portListener);
					}//if
				}//if connected
				//set the tab id if not already set
				/*if(!_this.tabID){
					chrome.tabs.getSelected(function(tab){
						_this.tabID = tab.id;
					});
				}//if*/

				return _this.connected;
			};//func

			//disconnect from the port
			this.disconnect = function(){
				if(!checkConnected()){ return false; }
				_this.actual.disconnect();
				_this.connected = false;
			};
			//add the on connect listener (only used by background.js)
			this.addOnConnectListener = function(callbacks, listeners){
				//incoming port.postMessages go through this port and function
				//-should really only ever be used by background.js
				//-inPort is the port from background.js ONLY
				//--so the only callbacks available are the ones set in background.js
				_this.isOnConnectListener = true;
				var onConnectListener = function(inPort, isExt) {
					_debug([name+': inPort connected: '+inPort.name+' | ext: '+isExt,inPort]);
						
					//store all connected ports
					var tabID = (!!inPort.sender.tab && !!inPort.sender.tab.id) ? inPort.sender.tab.id : inPort.name;
					_debug(name+': inPort tabID: '+tabID);
						
					(!connectedPorts[tabID]) ? connectedPorts[tabID] = {} : '';
					connectedPorts[tabID][inPort.name] = { port: inPort, name: inPort.name, tabID:tabID };
		
					//set portListenerCallbacks
					//-keep the existing callbacks that were already defined in the tab, which should never happen anyway
					_this.portListenerCallbacks[tabID] = {...callbacks,..._this.portListenerCallbacks[tabID]};
					//run the init callback if there is one
					//-the init callback is set in the addOnConnectListener that runs in background.js
					//-the function below is passed to sendResponse in background.js
					(typeof(listeners.init) != 'function') ? '' : 
						listeners.init(inPort, tabID, function (initMsg) {
							inPort.postMessage(initMsg);
						});
					
					//set the tab id of the inport
					//inPort.tabID = tabID;

					//the message listener
					inPort.onMessage.addListener(function(msg){
						_debug([name+': ===> inPort post msg received: '+msg.method,msg]);
						
						if(!msg.method){ _debug(name+': inPort regular msg error: Required property "method" is undefined',true); return false; }
						switch(true){
							//if a callback was defined for this tab
							case(!!_this.portListenerCallbacks[tabID][msg.method]):
								_debug(name+': inPort => post callback: '+msg.method);
								_this.portListenerCallbacks[tabID][msg.method](msg,(inPort.sender || {}),function(inMsg){
									inMsg.method = msg.method;
									inMsg.callbackID = msg.callbackID;
									inPort.postMessage(inMsg);
								});
							break;
							//if this was a callback sent with a port message
							case(!!msg.callbackID && !!_this.portMsgCallbacks[msg.callbackID]):
								_this.portMsgCallbacks[msg.callbackID](msg);//,sender,response)
								delete _this.portMsgCallbacks[msg.callbackID];
							break;//*/
							//also check the broadcast listeners
							case(!!_this.broadcastCallbacks[msg.method] && !inPort.sender.tab):
								_debug(name+': inPort => BA broadcast callback: '+msg.method);
								_this.broadcastCallbacks[msg.method](msg,inPort.sender,function(inMsg){
									//_debug(['typeof inMsg: '+typeof(inMsg),inMsg]);
									if(typeof(inMsg) == 'object'){
										inMsg.method = msg.method;
										inMsg.callbackID = msg.callbackID;
										inPort.postMessage(inMsg);
									}//if
								});
							break;
							//if there is a sender tab, as in not the browser action menu
							case(!!_this.broadcastCallbacks[msg.method]):
								_debug(name+': inPort => broadcast callback: '+msg.method);
								//get the updated tab info in case it moved or something
								chrome.tabs.get(inPort.sender.tab.id,function(_tab){
									inPort.sender.tab = _tab;
									_this.broadcastCallbacks[msg.method](msg,inPort.sender,function(inMsg){
										//_debug(['typeof inMsg: '+typeof(inMsg),inMsg]);
										if(typeof(inMsg) == 'object'){
											inMsg.method = msg.method;
											inMsg.callbackID = msg.callbackID;
											inPort.postMessage(inMsg);
										}//if
									});
								});
							break;
							default:
								_debug(name+': No default inPort message action specified: '+msg.method);
							break;
						}//switch
					});
					//listener for ports that disconnect from this port
					inPort.onDisconnect.addListener(function(){
						_debug(name+': inPort disconnected: '+inPort.name);
						delete connectedPorts[tabID];
						delete _this.portListenerCallbacks[tabID];
					});
				};//onConnect

				//add the onconnect listener
				if(!chrome.runtime.onConnect.hasListener(onConnectListener)){
					chrome.runtime.onConnect.addListener(onConnectListener);
				}//if
				//add the listener for chrome apps
				if(!!chrome.runtime.onConnectExternal && !chrome.runtime.onConnectExternal.hasListener(function(inPort){
						onConnectListener(inPort,true);
					})){
					chrome.runtime.onConnectExternal.addListener(function(inPort){
						onConnectListener(inPort,true);
					});
				}//if
			}//func addOnConnectListener
			
			//check status of connection
			var checkConnected = function(init){
				switch(true){
					//if the port is disconnected, throw error and return false
					case(!_this.connected && !_this.isOnConnectListener):
						(!init) ? _debug(name+': Port postMessage error: You are not connected to a port',true) : '';
						return false;
					break;
					default:
						return true;
					break;
				}//switch
			};//func checkConnected
			
			//outgoing port.postMessages go through the actual port and this function
			this.postMessage = function(msg,callback){
				if(!checkConnected()){ return false; }
				//portMessage/postMessage callbacks are stored in the obj keyed by the current timestamp, which is then sent along with the request so it can be used to fire the callback later
				//-broadcast messages have this functionality built in already
				if(typeof(callback) == 'function' && !_this.isOnConnectListener){
					var _d = new Date(),
						callbackID = _d.getTime() - (Math.ceil(Math.random()*500000)+1);
					delete _d;
					//if there already is a callback with this ID, subtract another random value
					(!!_this.portMsgCallbacks[callbackID]) ? callbackID -= (Math.ceil(Math.random()*500000)+1) : '';
					_this.portMsgCallbacks[callbackID] = callback;// || function(){};
					msg.callbackID = callbackID;
				}//if
				//console.log(name+': >>>>>>>>>>>>>> post msg:');
				//console.debug(_this.actual);
				//if this is not an onconnect listener, send the message through the port
				if(!_this.isOnConnectListener){
					_this.actual.postMessage(msg);
				} else {
					//if this is an onconnect listener connection, that means that the script is trying to send a message to itself
					//find and call the appropriate broadcast listener
					_this.broadcastCallbacks[msg.method] && _this.broadcastCallbacks[msg.method](msg,{},callback);
				}//if
				//_debug('-~~~~~~-Port postMessage: '+msg.method+' | callbackID: '+msg.callbackID);
			};
			//backwards compatibility for portMessage
			this.portMessage = this.postMessage;
			
			//attach the port listeners
			this.addPortListener = function(obj){
				if(typeof(obj) == 'object'){
					for(var i in obj){
						if(typeof(obj[i]) == 'function'){
							_this.portListenerCallbacks[i] = obj[i];
						} else {
							_debug(name+': Port addPortListener error: Invalid function: '+i+', you require a new function',true);
						}//if
					};
				}//if
			};//func addPortListener
			//process port messages
			var portListener = function(msg) {
				_debug([name+': ===> Port post msg received: '+msg.method+' | callbackID: '+msg.callbackID,msg]);
				//_debug(_this.portMsgCallbacks);
				if(!msg.method){ _debug(name+': Port post msg error: Required property "method" is undefined', true); return false; }
				switch(true){
					case(!!msg.callbackID && !!_this.portMsgCallbacks[msg.callbackID]):
						_debug([name+': port post msg callback: '+msg.method]);
						_this.portMsgCallbacks[msg.callbackID](msg);
						delete _this.portMsgCallbacks[msg.callbackID];
					break;
					case(!!_this.portListenerCallbacks[msg.method]):
						_debug([name+': port listener callback: '+msg.method]);
						_this.portListenerCallbacks[msg.method](msg);
					break;
					//also check the broadcast listeners
					case(!!_this.broadcastCallbacks[msg.method]): //adj this
						_debug(name+': port => broadcast callback: '+msg.method);
						_this.broadcastCallbacks[msg.method](msg,_this.actual.sender,
							//use portmsg callback, use this to call the callback, then delete
							function(inMsg){
								if(typeof(inMsg) == 'object'){
									inMsg.method = msg.method;
									inMsg.callbackID = msg.callbackID;
									inPort.postMessage(inMsg);
								}//if
							});
					break;
					default:
						_debug(name+': No default port message action specified: '+msg.method);
					break;
				}//switch
			};//func portListener
			//send tab message
			this.tabMessage = function(tabID, msg,callback){
				(!!chrome.tabs && !!chrome.tabs.sendMessage) ? 
					chrome.tabs.sendMessage(tabID, msg, callback) : '';
			};
			//send broadcast message to all tabs
			this.broadcastMessage = function(msg,callback){
				chrome.runtime.sendMessage(msg,callback);
			};
			//add broadcast listener
			this.addBroadcastListener = function(obj){
				if(typeof(obj) == 'object'){
					for(var i in obj){
						if(typeof(obj[i]) == 'function'){
							_this.broadcastCallbacks[i] = obj[i];
						} else {
							_debug(name+': Port addBroadcastListener error: Invalid function: '+i+', you require a new function',true);
						}//if
					};
				}//if
			};
			//process the broadcast listener
			var broadcastListener = function(msg,sender,response){
				_debug([name+': ===> Port broadcast msg received: '+msg.method,msg]);
				if(!msg.method){ _debug(name+': Port broadcast msg error: Required property "method" is undefined',true); return false; }
				switch(true){
					//if there is a broadcast listener, execute it
					case(!!_this.broadcastCallbacks[msg.method]):
						_debug([name+': broadcast callback: '+msg.method]);
						_this.broadcastCallbacks[msg.method](msg,sender,response);
					break;
					//check the port listeners, if there is not a broadcast listener, use the port listener
					case(!!_this.portListenerCallbacks[msg.method]):
						_debug(name+': broadcast => port callback: '+msg.method);
						_this.portListenerCallbacks[msg.method](msg);
					break;
					default:
						_debug(name+': No default broadcast message action specified: '+msg.method);
					break;
				}//switch
			};//func broadcastListener
			//attach the listener function
			chrome.runtime.onMessage.addListener(broadcastListener);
			//also attach to chrome app
			!!chrome.runtime.onMessageExternal && chrome.runtime.onMessageExternal.addListener(broadcastListener);
			
			//enable/disable console logging, stored in Settings
			this.setDebug = function(_val){
				console.log(name+': setDebug: '+_val);
				doDebug = _val;
			};
			//the debug logging
			//-the function can accept a function, object, or string/number/bool
			var _debug = function(item, error){
				if(!doDebug){ return false; }

				switch(true){
					case(typeof(item) == 'function'):
						item();
					break;
					case((/(string|number|boolean)/).test(typeof(item))):
						(!!error) ? console.error(''+item) : console.log(''+item);
					break;
					case(typeof(item) == 'object'):
						if(!!item.push && !!item.length > 0){
							(!!error) ? console.error(item[0]+':') : console.log(item[0]+':');
							(!!item[1]) ? console.debug(item[1]) : '';
						} else {
							console.debug(item);
						}//if
					break;
					default:
						(!!error) ? console.error(''+item) : console.log(''+item);
					break;
				}//switch
			}//func
			//call connect if a string name has been set
			if(typeof(obj.name) == 'string'){
				this.connect({name: obj.name});
			}//if
			//return the reference
			return this;
		};//func Port
}//if Port undefined