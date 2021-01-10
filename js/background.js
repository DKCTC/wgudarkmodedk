//-----------------------------------------------------------------
//***** WGU Task Dark Mode and Large Text by DK background.js *****
//-----------------------------------------------------------------
//the manifest
var _manifest = chrome.runtime.getManifest(),
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
	
	//debug console logging for dev only
	//--text = text to log to the concole
	//--obj = optional object to debug to the console
	cLog = function(text,obj){
		if(!!development){
			console.log(text);
			!!obj && console.debug(obj);
		}//if
	},
	
	//prepare the toggle
	//-this function only fires when an option is selected from the contextmenu or broweraction button
	//--font = true if the font option was selected in the contextmenu, false otherwise
	preToggle = function(font){
		//flip enabled flag to the opposite for the selected option
		enabled[(!!font && 'largefont') || 'darkmode'] = !enabled[(!!font && 'largefont') || 'darkmode']
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
	executeToggle = function(taskTabs,insert,font){
		//the css file to use for the option
		var file = files[((!!font && 'largefont') || 'darkmode')];

		cLog('-executeToggle insert: '+insert+' | font: '+font+' | file: '+file+' | canRemoveCSS: '+canRemoveCSS+' | taskTabs:',taskTabs);

		//update the selected context menu item text
		chrome.contextMenus.update(((!!font && 'largefont') || 'darkmode'),{
			title: ((!!insert && 'Disable') || 'Enable')
				+' '+((!!font && 'large font size') || 'dark mode')
		});

		//go through the tab array and execute the toggle
		taskTabs.forEach(function(_tab,i){
			switch(true){
				//if this is Chrome 87+, use insertCSS and removeCSS and insert/remove specific CSS file
				case(!!canRemoveCSS):
					cLog('--executeToggle canRemoveCSS: '+_tab.id);
					//if the file should be inserted
					if(!!insert){
						cLog('---executeToggle insertCSS: '+_tab.id);
						chrome.tabs.insertCSS(_tab.id,{
							file:file
						}, function(){
							cLog('++++ css inserted');
						});
					} else {
						//else remove it
						cLog('---executeToggle removeCSS: '+_tab.id);
						chrome.tabs.removeCSS(_tab.id,{
							file:file
						}, function(){
							cLog('---- css removed');
						});
					}//if
				break;
				//if not Chrome87+ and the script should be executed
				default:
					cLog('--executeToggle SCRIPT css toggle: '+_tab.id);
					//execute the script that toggles the classes on the html container
					chrome.tabs.executeScript(_tab.id, {
						code:'document.getElementsByTagName("html")[0].classList.'
							+((!!insert && 'add') || 'remove')+'("'
								+classes[((!!font && 'largefont') || 'darkmode')]
							+'");'
					});
				break;
			}//switch
		});//taskTabs.forEach
	},//executeToggle
	//get the sync data on first launch or reload
	firstLaunch = function(reload){
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
				//toggle darkmode
				executeToggle(_tabs,!!enabled.darkmode,false);
				//toggle largefont
				executeToggle(_tabs,!!enabled.largefont,true);
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

//on browseraction click, only toggle darkmode
//-largefont is in the contextmenu for now because I don't feel like making a browseraction menu
/*chrome.browserAction.onClicked.addListener(function(activeTab){
	preToggle(false);
});//*/

//on tab navigate only for wgu task tabs
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, _tab) {
	//reset regexp lastIndex so it will actually work
	taskURL.regexp.lastIndex = 0;
	//if this is a WGU task tab and it's done loading, executeToggle
	if(!!(taskURL.regexp).test(_tab.url) && changeInfo.status == 'complete'){
		cLog('=========onUpdatedTab tabId: '+tabId,changeInfo);
		cLog('-_tab:',_tab);
		//toggle darkmode, executeToggle is expecting an array of tabs
		executeToggle([_tab],!!enabled.darkmode,false);
		//toggle largefont
		executeToggle([_tab],!!enabled.largefont,true);	
	}//if
});
	
//after install/update, get enabled value and execute toggle
//-this might not be necessary because I'm telling it to get the data on launch anyway
chrome.runtime.onInstalled.addListener(function(details){
	cLog('=========onInstalled:',details);
	if((/(update|install)/gi).test(details.reason)){
		//send true because this is a reload, not really used except for logging
		firstLaunch(true);
	}//if
});

//get the sync data
firstLaunch();
