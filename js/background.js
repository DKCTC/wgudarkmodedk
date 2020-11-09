
//***** WGU Task Dark Mode by DK background.js

//-figure out why the icon isn't changing
//--figure out why the stupid icon isn't working, might need to make a 16px version
//-maybe set chrome sync storage for dark mode
//--but maybe only have it remember per tab, but how often are these tabs refreshed anyway?

//-rethink the whole badge text and color thing, maybe go back to the icon thing
//--need to find a way to detect if the css has been inserted
//--the badge text thing is all screwed up now with the tabId

//---------------------
//the manifest
var _manifest = chrome.runtime.getManifest(),
	//Chrome 87+ has this function which can add and remove CSS files, much easier for dark mode
	canRemoveCSS = !!(typeof(chrome.tabs.removeCSS) == 'function'),
	development = false;

//---------------------
//if this is the dev version, add the context menu item for reload for quick debug
chrome.management.get(chrome.runtime.id,function(runData){
	if(runData.installType == 'development'){
		development = true;
		console.log('--------- WGU Dark Mode background.js loaded: '+ _manifest.name +' | '+_manifest.version); //_manifest.description
		//clear the context menu first
		chrome.contextMenus.removeAll(function(){});
		//add reload context menu item
		chrome.contextMenus.create({
				title:'WGU Dark Mode by DK - Reload extension', //DKCCE
				onclick: function(obj,tab){
					chrome.runtime.reload();
				}
			});
	}//if
});

//function to toggle the badge text
var toggleBadge = function(activeTab,execute){
		//get the badge background color to see if dark mode is already on
		//-dark mode on is 255,255,255,0 (ironically)
		var insert = false;

		chrome.browserAction.getBadgeBackgroundColor({},function(_color){
			//console.debug(_color);});
			cLog('~~~~~~ toggleBadge START getBadgeBackgroundColor: '+activeTab.tabId,_color);

			switch(true){
				//if 0, then dark mode is not on, set to LITE, color 1
				case(_color[0] == 0):
					insert = false;
					/*chrome.browserAction.setIcon({
						tabId:activeTab.tabId,
						path: 'img/wgu-icon-light.png'
					},function(obj){});*/
					//set background color to 255
					chrome.browserAction.setBadgeBackgroundColor({
						color:[1,1,1,1],//[0,0,0,0],
						tabId:activeTab.tabId
					},function(__color){
						cLog('toggleBadge TO LITE setBadgeBackgroundColor: '+activeTab.tabId,arguments);
						//execute the toggle if set
						if(!!execute){
							executeToggle(activeTab,insert);
						}//if
					});
					chrome.browserAction.setBadgeText({tabId:activeTab.tabId, text: 'LITE'});
				break;
				//if 1, then dark mode is on, set to DARK, color 0
				//-if 127, then this was previously not a task tab and now is, so dark mode should be off
				//--unless I change it to remember the setting, which would be checked before getting here
				case(_color[0] == 1):
				case(_color[0] == 127):
					insert = true;
					/*chrome.browserAction.setIcon({
						tabId:activeTab.tabId,
						path: //'img/wgu-icon-dark.png'
							{
								16: '../img/wgu-icon-dark.png',
								48: '../img/wgu-icon-dark.png',
								128: '../img/wgu-icon-dark.png',
								256: '../img/wgu-icon-dark.png'
							}
					},function(obj){});*/
					//set background color to 1
					chrome.browserAction.setBadgeBackgroundColor({
						color:[0,0,0,1],
						tabId:activeTab.tabId
					},function(__color){
						cLog('toggleBadge TO DARK setBadgeBackgroundColor: '+activeTab.tabId,arguments);
						//execute the toggle if set
						if(!!execute){
							executeToggle(activeTab,insert);
						}//if
					});
					chrome.browserAction.setBadgeText({tabId:activeTab.tabId,text: 'DARK'});
				break;
				//if it was previously N/A and now is a task tab
				/*case(_color[0] == 127):
					//maybe used seperately later
				break;*/
			}//switch

			//execute the toggle if set
			/*if(!!execute){
				executeToggle(activeTab,insert);
			}//if*/
		});//getBadgeBackgroundColor
	},//toggleBadge

	//execute the toggle
	executeToggle = function(activeTab,insert){	
		switch(true){
			//if this is Chrome 87+, use insertCSS and removeCSS and insert/remove specific CSS file
			case(!!canRemoveCSS):
				cLog('executeToggle canRemoveCSS: '+activeTab.tabId);
				//console.debug(_color);
				//if the file should be inserted
				if(!!insert){
					cLog('executeToggle insertCSS: '+activeTab.tabId);
					chrome.tabs.insertCSS(activeTab.tabId,{
						file:'css/wgudark87.css'
					}, function(){
						cLog('+++ css inserted');
					});
				} else {
					//else remove it
					cLog('executeToggle removeCSS: '+activeTab.tabId);
					chrome.tabs.removeCSS(activeTab.tabId,{
						file:'css/wgudark87.css'
					}, function(){
						cLog('--- css removed');
					});
				}//if
			break;
			//if not Chrome87+ and the script should be executed
			//case(!!execute):
			default:
				//execute the script that toggles the classes on the html container
				chrome.tabs.executeScript(activeTab.tabId, {
					code:'["wgudmdk","dark-mode","large-font"].map(v=>document.getElementsByTagName("html")[0].classList.toggle(v));'
				}, function(resp){});
			break;
		}//switch
	},//executeToggle

	//check the tab
	checkTab = function(activeTab){
		//get the url of the tab to determine which icon to display
		chrome.tabs.get(activeTab.tabId,function(_tab){
			if(!!(/^https\:\/\/tasks\.wgu\.edu\/*.*/gi).test(_tab.url)){
				//enable browserAction
				chrome.browserAction.enable(activeTab.tabId,function(){
					cLog('checkTab enable: '+activeTab.tabId);
					//get the badge background color to see if dark mode is already on
					//-dark mode on is 255,255,255,0 (ironically)
					toggleBadge(activeTab);
				});
				//also need to check if dark mode is active already somehow
				//-setIcon tabId can limit changes to just that tab
				//--set the default to be disabled
				//--then check to see if dark mode is already on by checking the badge background color
			} else {
				chrome.browserAction.disable(activeTab.tabId,function(){
					cLog('checkTab disable: '+activeTab.tabId);
					//set the icon to none
					/*chrome.browserAction.setIcon({
						tabId:activeTab.tabId,
						path: //'img/wgu-icon-none.png',
							{
								16: '../img/wgu-icon-none.png',
								48: '../img/wgu-icon-none.png',
								128: '../img/wgu-icon-none.png',
								256: '../img/wgu-icon-none.png'
							}
					},function(obj){});*/

					//set the badge background color to RGBA 127,127,127,0 (disabled)
					/*chrome.browserAction.setBadgeBackgroundColor({
						color:[127,127,127,1],//[0,0,0,0],
						tabId:activeTab.tabId
					},function(_color){
						cLog('checkTab N/A setBadgeBackgroundColor: '+activeTab.tabId,_color);
					});*/
					//chrome.browserAction.setBadgeText({tabId:activeTab.tabId,text: 'N/A'});
				});
			}//if
		});
	},//checkTab
	//debug console logging for dev only
	cLog = function(text,obj){
		if(!!development){
			console.log(text);
			!!obj && console.debug(obj);
		}//if
	};
//after install/update, check current tab
chrome.runtime.onInstalled.addListener(function(details){
	//console.log('onInstalled:');
	//console.debug(details);
	if((/(update|install)/gi).test(details.reason)){
		//console.log('updated:');
		//get the active tab in the current window
		//-there will probably be multiple windows and the text should only set for the applicable tabs
		//--so this might have to expand
		//--and what if this isn't a WGU task url?
		//--and now I am getting the tab details twice, but oh well, it only happens on install and update
		chrome.tabs.query({active:true,currentWindow:true},function(_tab){
			cLog('-update|install:',_tab);
			//checkTab(_tab[0]);
			checkTab({tabId:_tab[0].id});
			//if this is a wgu task url, toggle the badge 
			/*if((/^https\:\/\/tasks\.wgu\.edu\/*.* /gi).test(_tab[0].url)){
				toggleBadge(_tab[0]);
			} else {
				chrome.browserAction.setBadgeBackgroundColor({
						color:[127,127,127,1],//[0,0,0,0],
						tabId:_tab[0].tabId
					},function(_color){
						console.log('WGU Dark mode NONE setBadgeBackgroundColor: '+_tab[0].tabId)
						console.debug(_color);
					});
				chrome.browserAction.setBadgeText({text : 'N/A'});
			}//if wgu task url*/
		});//query
	}//if
});//*/

//check to see if this is a wgu task tab, and make the icon different
//-need a grayed out version, a version with dark mode on, and a version with it off
chrome.tabs.onActivated.addListener(function(activeTab){
	//console.log('tab activated');
	//console.debug(activeTab);
	checkTab(activeTab);
	/*{
		tabId: 3431
		windowId: 3554
	}*/
});//*/

//on tab navigate only for wgu task tabs
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if(!!(/^https\:\/\/tasks\.wgu\.edu\/*.*/gi).test(tab.url) && changeInfo.status == 'complete'){
		cLog('-onUpdatedTab:',arguments);
		checkTab({tabId:tabId});
	}//if
});

//on browseraction click
chrome.browserAction.onClicked.addListener(function(activeTab){
	//console.log('WGU dark activeTab:');
	//console.debug(activeTab);
	toggleBadge(activeTab,true);
});
	/*{
			"active":true,
			"audible":false,
			"autoDiscardable":true,
			"discarded":false,
			"favIconUrl":"https://tasks.wgu.edu/favicon.ico",
			"height":967,
			"highlighted":true,
			"id":3431,
			"incognito":false,
			"index":1,
			"mutedInfo":{"muted":false},
			"pinned":false,
			"selected":true,
			"status":"complete",
			"title":"WGU Performance Assessment",
			"url":"https://tasks.wgu.edu/student/000888922/course/15900014/task/423/overview#taskOverviewIntroduction",
			"width":1800,
			"windowId":3554
		}*/

//potentially remember the setting

//checks tabs before they navigate
/*chrome.webNavigation.onBeforeNavigate.addListener(function(details){
	var _details = details;
});*/
