

//-figure out why the icon isn't changing
//-figure out why the background color detector isn't working, probably has to do with 0 instead of 1
//--that's not why, probably need to check for 127 too, but that might not even be necessary
//-move the changing stuff out to its own function
//-figure out why the stupid icon isn't working, might need to make a 16px version
//-change dark and light to ON and OFF
//-fix the labels and the disable thing and stop making the badge gray and make it 2,2,2,1

//============================================================
//======================== connection ========================
//============================================================
//the manifest
var _manifest = chrome.runtime.getManifest();

//---------------------
//--reload context menu for debug
//-need to check if this is the unpacked version before adding this

//clear the context menu first
chrome.contextMenus.removeAll(function(){});

//add reload context menu item
chrome.contextMenus.create({
		title:'WGU Dark Mode by DK - Reload extension', //DKCCE
		onclick: function(obj,tab){
			chrome.runtime.reload();
		}
	});


console.log('--------- WGU Dark Mode background.js loaded: '+ _manifest.name +' | '+_manifest.version); //_manifest.description

//also need a function for ext install|update
chrome.runtime.onInstalled.addListener(function(details){
	//console.log('onInstalled:');
	//console.debug(details);
	if((/(update|install)/gi).test(details.reason)){
		//console.log('updated:');
		chrome.browserAction.setBadgeText({text : 'SOME'});
	}//if
});//*/

//check to see if this is a wgu task tab, and make the icon different
//-need a grayed out version, a version with dark mode on, and a version with it off
chrome.tabs.onActivated.addListener(function(activeTab){
	//console.log('tab activated');
	//console.debug(activeTab);
	//activeTabId = activeTab.tabId;
	/*{
		tabId: 3431
		windowId: 3554
	}*/
	//get the url of the tab to determine which icon to display
	chrome.tabs.get(activeTab.tabId,function(_tab){
		if((/^https\:\/\/tasks\.wgu\.edu\/*.*/gi).test(_tab.url)){
			//enable browserAction
			chrome.browserAction.enable(activeTab.tabId,function(){
				//get the badge background color to see if dark mode is already on
				//-dark mode on is 255,255,255,0 (ironically)
				chrome.browserAction.getBadgeBackgroundColor({},function(_color){
					console.log('WGU Dark mode GET getBadgeBackgroundColor: '+activeTab.tabId)
					console.debug(_color);

					switch(true){
						//if 1, then dark mode is not on, set to OFF
						case(_color[0] == 0):
							/*chrome.browserAction.setIcon({
								tabId:activeTab.tabId,
								path: 'img/wgu-icon-light.png'
							},function(obj){});*/
							//set background color to 255
							chrome.browserAction.setBadgeBackgroundColor({
								color:[1,1,1,1],//[0,0,0,0],
								tabId:activeTab.tabId
							},function(__color){
								console.log('WGU Dark mode OFF setBadgeBackgroundColor: '+activeTab.tabId)
								console.debug(arguments);
							});
							chrome.browserAction.setBadgeText({text: 'DARK'});
						break;
						//if 255, then dark mode is on, set to OFF
						case(_color[0] == 1):
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
								console.log('WGU Dark mode ON setBadgeBackgroundColor: '+activeTab.tabId)
								console.debug(arguments);
							});
							chrome.browserAction.setBadgeText({text: 'LITE'});
						break;
					}//switch
				});
			});
			//also need to check if dark mode is active already somehow
			//-setIcon tabId can limit changes to just that tab
			//--set the default to be disabled
			//--then check to see if dark mode is already on by checking the badge background color
		} else {
			chrome.browserAction.disable(activeTab.tabId,function(){
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
				chrome.browserAction.setBadgeBackgroundColor({
					color:[127,127,127,1],//[0,0,0,0],
					tabId:activeTab.tabId
				},function(_color){
					console.log('WGU Dark mode NONE setBadgeBackgroundColor: '+activeTab.tabId)
					console.debug(_color);
				});
				chrome.browserAction.setBadgeText({text: 'NONE'});
			});
		}//if
	});
});//*/

//potentially remember the setting

//checks tabs before they navigate
/*chrome.webNavigation.onBeforeNavigate.addListener(function(details){
	var _details = details;
});

chrome.tabs.update(_details.tabId, { url:url });

connection.tabMessage(repTabID,{method:'updateBriefs',briefs:tabs,closed:closed},function(response){
	console.debug(response);
});//*/


//check for install or update, change the browseraction text to new
//-put tab count instead
/*chrome.runtime.onInstalled.addListener(function(details){
	//console.log('onInstalled:');
	//console.debug(details);
	if((/(update|install)/gi).test(details.reason)){
		//console.log('updated:');
		//chrome.browserAction.setBadgeText({text : 'R'});
		queryTabs(true);
	}//if
});//*/

chrome.browserAction.onClicked.addListener(function(activeTab){
	//console.log('WGU dark activeTab: ');
	//console.debug(activeTab);
	/*
		{
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
		}
	*/
	//get the badge background color to see if dark mode is already on
	//-dark mode on is 255,255,255,0 (ironically)
	chrome.browserAction.getBadgeBackgroundColor({},function(_color){
		console.log('WGU Dark mode BA GET getBadgeBackgroundColor:' +activeTab.tabId)
		console.debug(_color);

		switch(true){
			//if 0, then dark mode is OFF, set to light
			case(_color[0] == 0):
				/*chrome.browserAction.setIcon({
					tabId:activeTab.tabId,
					path: //'img/wgu-icon-light.png'
						{
							16: '../img/wgu-icon-light.png',
							48: '../img/wgu-icon-light.png',
							128: '../img/wgu-icon-light.png',
							256: '../img/wgu-icon-light.png'
						}
				},function(obj){});*/
				//set background color to 255
				chrome.browserAction.setBadgeBackgroundColor({
					color:[1,1,1,1],//[0,0,0,0],
					tabId:activeTab.tabId
				},function(__color){
					console.log('WGU Dark mode BA OFF setBadgeBackgroundColor: '+activeTab.tabId)
					console.debug(__color);
				});
				chrome.browserAction.setBadgeText({text: 'DARK'});
			break;
			//if 255, then dark mode is on, set to dark
			case(_color[0] == 1):
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
					console.log('WGU Dark mode BA ON setBadgeBackgroundColor: '+activeTab.tabId)
					console.debug(__color);
				});
				chrome.browserAction.setBadgeText({text: 'LITE'});
			break;
		}//switch

		//execute the script that toggles the class on the html container, but only on wgu task pages
	    chrome.tabs.executeScript(activeTab.tabId, {
			//code: 'document.title = "'+titles[sender.tab.id].title+'-"; console.debug("the old name was '+titles[sender.tab.id].title+'-");'
			//code: 'console.debug("+++++++ the old name was: '+titles[sender.tab.id].title+'");'
			//code:'document.getElementsByTagName("html")[0].classList.toggle(["wgudmdk","dark-mode","large-font"]);'
			code:'["wgudmdk","dark-mode","large-font"].map(v=>document.getElementsByTagName("html")[0].classList.toggle(v));'
		}, function(resp){
			//refresh the list
			//$scope.loadTabsBackground();
		});//*/
	});
});
