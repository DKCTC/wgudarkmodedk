//-----------------------------------------------------------------
//***** WGU Task Dark Mode and Large Text by DK background.js *****
//-----------------------------------------------------------------
//the manifest
let _manifest = chrome.runtime.getManifest(),
	//the incoming port connection
	connection = new Port(),	
	//dev mode ext options, if true, dev mode ext reload context menu item will be added
	development = false,
	//WGU task page URLs
	taskURL = {
		//regexp for checking tab URL on navigation
		//-targets final task page url and not all of the loading urls
		regexp: /^https\:\/\/tasks\.wgu\.edu\/([\w]+)\/([0-9]+)\/course\/([0-9]+)\/task.*/gi,
		//match pattern for querying tabs
		pattern: 'https://tasks.wgu.edu/*/*/course/*/task/*'
	},
	//Chrome 87+ has a removeCSS function which can remove CSS files, much easier for dark mode, otherwise a script is used to add/remove classes to the html container for the CSS file that is included in the manifest
	canRemoveCSS = !!(typeof(chrome.tabs.removeCSS) == 'function'),
	//CSS filenames for Chrome 87+
	files = {
		darkmode:'css/wgudark87.css',
		largefont:'css/wgudark87font.css'
	},
	//CSS classnames for Chrome 86-
	classes = {
		darkmode:'dk-dark-mode',
		largefont:'dk-large-font'
	},
	//obj for storing darkmode and largefont options
	enabled = {
		darkmode: false,
		largefont: false
	},
	//tabs obj for storing task tab IDs
	allTabs = {
		darkmode: {},
		largefont: {}
	},	
	//debug console logging for dev only
	//--text = text to log to the concole
	//--obj = optional object to debug to the console
	cLog = function(text,obj){
		if(false){
		//if(!!development){
			console.log(text);
			!!obj && console.debug(obj);
		}//if
	},
	
	//prepare the toggle
	//-this function only fires when an option is selected from the contextmenu or broweraction button
	//--font = true if the font option was selected in the contextmenu, false otherwise
	preToggle = function(font){
		//flip enabled flag to the opposite for the selected option
		enabled[(!!font && 'largefont') || 'darkmode'] = !enabled[(!!font && 'largefont') || 'darkmode'];
		cLog('=========preToggle font: '+font,enabled);
		//store the new settings
		chrome.storage.sync.set({enabled: enabled});//, function(){});
		//set badge text if this isn't a font size toggle
		!font && chrome.browserAction.setBadgeText({text: ((!!enabled.darkmode && 'DARK') || 'LITE')});
		//toggle the tabs for the selected option
		chrome.tabs.query({url:taskURL.pattern},function(_tabs){
			cLog('-browserAction:',_tabs);
			//toggle whichever one was clicked
			executeToggle(_tabs,((!!font && !!enabled.largefont) || (!font && !!enabled.darkmode)),!!font);
		});
	},//preToggle
	
	//execute the toggle
	//--taskTabs = tab array of all of the tasks.wgu.edu tabs
	//--insert = option from enabled object for selected option
	//--font = true if the font option was selected in the contextmenu, false otherwise
	executeToggle = function(taskTabs,insert,font,reset){
		//the css file to use for the option
		let type = ((!!font && 'largefont') || 'darkmode'),
			file = files[type];
		//tabs has the url in a regex to match against the new url to see if it only has a hash or something in it
		cLog('>>>>GO executeToggle type: '+type+' | RESET: '+reset+' | insert: '+insert+' | font: '+font+' | file: '+file+' | canRemoveCSS: '+canRemoveCSS+' | taskTabs:',taskTabs);
		
		//update the selected context menu item text if this isn't a reset call
		if(!reset){
			chrome.contextMenus.update(type,{
				title: ((!!insert && 'Disable') || 'Enable')
					+' '+((!!font && 'large font size') || 'dark mode')
			});
		}//if

		//go through the tab array and execute the toggle
		taskTabs.forEach(function(_tab,i){
			/*cLog('-tab ID: '+_tab.id
				+' | has allTabs: '+!!allTabs[_tab.id]
				+' | matches URL: '+(!!allTabs[_tab.id] && !!allTabs[_tab.id].test(_tab.url))
				+' | tab URL: '+_tab.url);//*/
			switch(true){
				//if this is Chrome 87+, use insertCSS and removeCSS and insert/remove specific CSS file
				case(!!canRemoveCSS):
					cLog('--executeToggle canRemoveCSS: '+_tab.id+' | '+type);
					//if the file should be inserted
					switch(true){
						//if this is reset, we are forcing both sheets to be removed
						case(!!reset):
							['largefont','darkmode'].forEach((_type)=>{
								file = files[_type];
								delete allTabs[_type][_tab.id];
								cLog('---executeToggle removeCSS RESET: '+_tab.id+' | '+_type);
								chrome.tabs.removeCSS(_tab.id,{
									file:file
								}, function(){
									cLog('---- css reset: '+_tab.id+' | '+_type);
								});
							});//foreach
						break;
						case(!!insert):
							//if the tab has not been stored, then store it and add the stylesheet
							if(!allTabs[type][_tab.id]){
								allTabs[type][_tab.id] = new RegExp(_tab.url,'g');
								cLog('---executeToggle insertCSS: '+_tab.id+' | '+type);
								chrome.tabs.insertCSS(_tab.id,{
									file:file
								}, function(){
									cLog('++++ css inserted: '+_tab.id+' | '+type);
								});
							} else {
								cLog('==== css already inserted: '+_tab.id);
							}//if
						break;
						default:
							//else remove it
							delete allTabs[type][_tab.id];
							cLog('---executeToggle removeCSS: '+_tab.id+' | '+type);
							chrome.tabs.removeCSS(_tab.id,{
								file:file
							}, function(){
								cLog('---- css removed: '+_tab.id+' | '+type);
							});
						break;
					}//switch
				break;
				//if not Chrome87+ and the script should be executed
				default:
					cLog('--executeToggle SCRIPT css toggle: '+_tab.id+' | '+type);
					//execute the script that toggles the classes on the html container
					//-reset is not necessary here because the class is not re-added and the stylesheet is not added/removed multiple times
					if(!reset){
						chrome.tabs.executeScript(_tab.id, {
							code:'document.getElementsByTagName("html")[0].classList.'
								+((!!insert && 'add') || 'remove')+'("'
									+classes[type]
								+'");'
						});
					}
				break;
			}//switch
		});//taskTabs.forEach
	},//executeToggle
	//get the sync data on first launch or reload
	firstLaunch = function(reload){
		let togglePromise;
		chrome.storage.sync.get(null,function(items){
			cLog('-firstLaunch sync.get reload: '+!!reload+' | items:',items);
			//set the enabled flag to the stored value
			enabled = items.enabled || enabled;
			//set the badge text for darkmode
			chrome.browserAction.setBadgeText({text: ((!!enabled.darkmode && 'DARK') || 'LITE')});
			//get the task tabs and execute the toggle
			//-when the browser is first opened, there probably won't be any tabs, so this will not do anything anyway
			chrome.tabs.query({url:taskURL.pattern},function(_tabs){
				cLog('-update|install:',_tabs);
				togglePromise = new Promise((resolve,reject)=>{
					//first remove the css so that multiple don't end up getting added
					//-reset removes both stylesheets
					resolve(executeToggle(_tabs,false,false,true));
				}).then(()=>{
					//then toggle to add if enabled
					//-toggle darkmode
					executeToggle(_tabs,!!enabled.darkmode,false);
					//-toggle largefont
					executeToggle(_tabs,!!enabled.largefont,true);
				});
			});//query
		});//sync get
	};//firstLaunch

//connection port message listener
connection.addOnConnectListener({
	//click event fron menu
	event: function (msg, sender, sendResponse) {
		cLog('---menu input click:',msg);
		preToggle(msg.font);
		sendResponse({status:'success'});
	}
},{
	init: function (port, _tabID, sendResponse) {
		if(port.name == 'menu'){
			sendResponse({ method: 'enabled', enabled:enabled });
		}//if
	}
});

//if this is the dev version, add the context menu item for reload for quick debug
chrome.management.get(chrome.runtime.id,function(runData){
	//clear the context menu first
	chrome.contextMenus.removeAll(function(){});
	//add dark mode option
	chrome.contextMenus.create({
			title:'Toggle dark mode',
			id:'darkmode',
			documentUrlPatterns:[taskURL.pattern],
			onclick: function(obj,tab){
				preToggle(false);
			}
		});
	//add large text option
	chrome.contextMenus.create({
			title:'Toggle large font size',
			id:'largefont',
			documentUrlPatterns:[taskURL.pattern],
			onclick: function(obj,tab){
				preToggle(true);
			}
		});
	//if this is unpacked dev version, set development flag for console logging and reload ext context menu item
	if(runData.installType == 'development'){
		development = true;
		cLog('---------background.js loaded: '+ _manifest.name +' | '+_manifest.version,_manifest);
		//add reload context menu item
		chrome.contextMenus.create({
				title:_manifest.name + ' - Reload extension',
				id:'reloadext',
				onclick: function(obj,tab){
					chrome.runtime.reload();
				}
			});
	}//if
});

//navigation is about to occur, so reset the allTabs entries
chrome.webNavigation.onCommitted.addListener(function(obj){
	//reset regexp lastIndex so it will actually work
	taskURL.regexp.lastIndex = 0;
	//if this is a WGU task tab and it's done loading, executeToggle
	if(!!(taskURL.regexp).test(obj.url)){
		cLog('>>>>======webNavigation.onCommitted tabId: '+obj.tabId,obj);
		delete allTabs.darkmode[obj.tabId];
		delete allTabs.largefont[obj.tabId];
	}
});//*/

//this only fires on an actual navigation, not on a historystate link (# anchor, same page nav)
chrome.webNavigation.onCompleted.addListener(function(obj){
	//reset regexp lastIndex so it will actually work
	taskURL.regexp.lastIndex = 0;
	//if this is a WGU task tab and it's done loading, executeToggle
	if(!!(taskURL.regexp).test(obj.url)){
		cLog('>>>>======webNavigation.onCompleted tabId: '+obj.tabId,obj);
		//toggle darkmode, executeToggle is expecting an array of tabs
		//-only uses the ID and url, so send those in an obj
		executeToggle([{id:obj.tabId, url: obj.url}],!!enabled.darkmode,false);
		//toggle largefont
		executeToggle([{id:obj.tabId, url: obj.url}],!!enabled.largefont,true);
	}
});
	
//after install/update, get enabled value and execute toggle
//-this might not be necessary because I'm telling it to get the data on launch anyway
/*chrome.runtime.onInstalled.addListener(function(details){
	cLog('=========onInstalled:',details);
	if((/(update|install)/gi).test(details.reason)){
		//send true because this is a reload, not really used except for logging
		//firstLaunch(true);
	}//if
});//*/

//launch on install/update/reload
firstLaunch();
