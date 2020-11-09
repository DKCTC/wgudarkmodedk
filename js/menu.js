
//connect to background
var is = {
		iframe: (window !== window.parent)
	},
	//connection = new Port({name: ((!!is.iframe && 'iframe-') || '') + 'menu'}),
	connection = new Port({ name: 'menu' }),
	port = connection.actual,
	_tab = {},
	domain,
	urls = false,
	prefs = {
		googleSearchNewTabs: false
	},
	//urls to catch
	//-get these from background instead, perhaps in the init callback from the port, maybe attach the data to the port obj somehow
	//filter = /(bulging-disc-info|laserspine|laserspineinstitute|laserspinelocations|laserspinewellness|lsi-stlouis|lsicincinnati|lsicleveland|lsinewsroom|lsioklahomacity|lsiphilly|lsiphysicianrelations|lsiscottsdale|lsitampa|news.laserspineinstitute|pinchednervespine|spine-exercises|spineseminar)\.(com|net)/gi,
	//craft = /(lsioklahomacity|lsicleveland)/gi,
	//cms = /\/(cms|dashboard|admin)\//,
	//close window/iframe
	_close = function(){
		console.log('---menu.js: _close')
		/*if(!!is.iframe){
			//console.log('----is.iframe true')
			//send message to parent window to close the overlay
			window.parent.postMessage({method:'ext-overlay'},'*');
		} else {
			//console.log('----is.iframe false')
			window.close();
		}//if*/
		window.close();
	},
	changeTab = function(){

		//-don't really need radio buttons for the tab options, replace with buttons
		//--new, same, copy, reset
		//--also look into using unicode symbols for the labels, look at fontawesome
		//-maybe make the tab's env selected by default, along with domain
		//--update the qr code when env or domain are changed and on reset button
		//-need to disable the env form fields or just hide it on non-prod
		//-maybe create changelog, but it'll be crazy at first
		//--maybe just make a git repo so it can be shared, or maybe just don't

		//-motion clicks on menu buttons click on the wrong ones?
		//--just change the layout for the motion version to be more like mobile
		//--or enable motion on menu.js if it's in an iframe and make a cursor option for moving a highlight through a set of elements
		//--there is really no need for the cursor in prod.js
		//-document that process
		//-move that doctor to AZ
		//-more tealium, try to get credentials for all of the services and get the embed codes directly


		chrome.tabs.getSelected(function(tab){
			//console.debug(tab);
			_tab = tab;
			domain = tab.url.replace(/(http(s)*:\/\/(www\.)*)([^/]*)(\/.*)*/,'$4') || '';

			/*tabURL = tab.url;
			tabID = tab.id;
			windowID = tab.windowId;//*/
			
			//get the list of keyboard shortcuts from the tab and update the list
			//-not used right now
			getKeysList(tab.id);

			/*//if this is a site that uses craft cms
			is.craft = craft.test(tab.url);
			//if this is a cms page
			is.cms = cms.test(tab.url);
			//if this is a prod site
			is.prod = filter.test(tab.url);
			
			//if this is not a prod site or it is a cms site, add _notprod (disables buttons)
			if(!is.prod || !!is.cms){
				$('body').addClass('_notprod');
			} else {
				$('body').removeClass('_notprod');
			}//if
			if(!!is.craft){
				$('body').addClass('_craft');
			} else {
				$('body').removeClass('_craft');
			}//if*/
			//create the qr code and place the url into the input field
			$('.qrcode .qrcode-container').html('')
				.qrcode({ width: 175, height: 175, text: tab.url });
			$('.qrcode .qrcode-url').val(tab.url);
		});
	},
	//create the nav/copy url, also for qr code
	createURL = function(){
		//-need to handle alt+w to clone the current tab
		//--maybe use a chrome ext api thing
		//-need to set the default domain, env, and target options
		//--maybe set domain dropdown to the current domain and get rid of current URL
		//--also make the element taller

		//chrome.tabs.getSelected(function(tab) {
			//console.debug(msg);
			//console.debug(tab);
			//copy:!!$(this).is('.copy'),
			/*var data = $('.nav.site form').serializeArray().map(d => d.value),
				domain = data[0],
				prefix = data[1],//
				//target = data[2],
				
			//prefix from menu2 includes the dot if required
			//-remove the existing prefix in case this is going to prod
				url = _tab.url; //*/
				//_new = (target == '_blank');// || !!msg.clone);

			//if(!msg.clone){
				//get rid of existing prefix
				/*url = url.replace(/((legacy-dev|legacy-staging|ld|www|dev)\.)*&&&&&/gi,'') //<-- remove these &s
					.replace(/(http(s*):\/\/)([^\/?]*)(.*)/gi,
						//protocol
						'$1'
						//domain prefix (legacy-dev, www, etc)
						+(prefix || '')
						//domain - either passed, or if blank, use the existing domain
						+(domain || '$3')
						//path
						+((!!is.prod && '$4') || ''))
					//protocol again - always force http for dev, will redirect for others
					.replace(/^http(s*):/i,'http:')
					//handle sites that use dev and not legacy-dev, they have :: in them
					.replace(/(legacy-((dev|staging)\.))*::/,'$2');*/
			//}//if

			//console.log('--createURL:');
			//console.debug({ url: url, taburl: _tab.url, new:_new, nav: url != _tab.url });

			//if the new url is not the same as the existing one after going through the filter, navigate the page
			//return { url: url, nav: url != _tab.url }; //new:_new,
			
			return { url: _tab.url, nav: false };
			
			//sendResponse({tabid:tab.id, tabindex:tab.index, windowid:tab.windowId});
		//});
	},
	getKeysList = function(tabID){
		///do nothing for now
		//return false;

		var list = $('.keys-list');
		//get the keydown obj from the active tab and update the shortcut list
		//-this does not include the callback functions
		//-need to add buttons and a listener to keydown that creates and executes the corresponding keydown event
		//-also need to group shortcuts with the same button together, and come up with a sort order
		//-also need to block this from appearing on ext pages, or come up with something else
		connection.tabMessage(tabID,{method:'getKeysList'},function(response){
			//console.log('>>> getKeysList:');
			//console.debug(response);
			//go through response array
			if(!response || !response.length){
				//disable menu item
				//-do nothing
				//$('.ext-menu-item.labels.keydown')
				//list.addClass('disabled');
			} else {
				var items = [];
				response.forEach((_events,idx) => {
					//go through event obj
					$.each(_events,function(i,v){
						items.push('<div data-which="'+i+'" data-modifiers="'+v.modifiers.join(',')+'" class="_row'+((!!v.dev && ' _dev') || '')+'">'
							+'<div class="keys-button">'// data-which="'+i+'" data-modifiers="'+v.modifiers.join(',')+'">'
								+v.shortcut
							+'</div>'
							+'<span>'
								+'<span>'+v.title+'</span>'	
								+'<span>'+v.desc+'</span>'
							+'</span>'
						+'</div>');
					});
				});
				list.append(items.sort().join(''));
			}//if
		});

	},//func
	//tab count
	updateTabCount = function(){
		chrome.tabs.query({},function(tabs){
			//console.log('tabs:')
			//console.debug(tabs);
			document.querySelectorAll('#tab-count')[0].innerHTML = tabs.length;
			document.querySelectorAll('#tab-count')[0].title = tabs.length+' tabs';
		});
	},
	//window count
	updateWindowCount = function(){
		chrome.windows.getAll({},function(win){
			//console.log('windows:')
			//console.debug(win);
			document.querySelectorAll('#window-count')[0].innerHTML = win.length;
			document.querySelectorAll('#window-count')[0].title = win.length+' windows';
		});
	};

connection.addPortListener({
	init: function(msg, sender, sendResponse){
		console.log('init received:');
		console.debug(arguments);
	},
	getGoogleSearch: function(msg, sender, sendResponse){
		console.log('-getGoogleSearch received: '+msg.value.googleSearchNewTabs);
		console.debug(msg.value);
		prefs.googleSearchNewTabs = msg.value.googleSearchNewTabs;
		$('section.nav input[type="checkbox"].googleSearchNewTabs')[0].checked = !!prefs.googleSearchNewTabs;
	},//*/
});

//get prefs
//-just googleSearchNewTabs for now
/*connection.postMessage({
		method:'getGoogleSearch'
	},function(response){
		console.log('---getGoogleSearch resp:');
		console.debug(response);
		prefs.googleSearchNewTabs = response.value;
	});//*/

//clear badge text
//-now has the tab count in it, don't clear it
//connection.postMessage({ method:'badge', text: '' });

//update the tab info when the tab is changed
//-should never happen, but for testing with the debugger open
chrome.tabs.onActivated.addListener(function(activeInfo){
	console.log('changeTab: '+activeInfo.tabId);
	console.debug(activeInfo);
	changeTab();
});


(function($){
	//window event listener to fire motion keytaps on motion elements
	//-need to add option for firing mouseenter on the select2 options so that they get highlighted on hover
	window.addEventListener('message',function(ev){
		switch(true){
			//close the overlay
			case(ev.data && ev.data.method == 'ext-motion-keytap'):
				//console.log('---menu.js keytap:');
				//figure out which element it is based on the coordinates and fire a click event
				
				var el = $(document.elementFromPoint(ev.data.cursor.x,ev.data.cursor.y));
				//console.debug(el);

				switch(true){
					//if this is a select span, call mousedown so the dropdown will open
					case(!!el.is('span[class*="select2"]')):
						//console.log('--select2 mousedown');
						el.trigger($.Event( 'mousedown', { which: 1 } ));
					break;
					//if this is a select2 option, call mouseup so the option will be selected
					case(!!el.is('.select2-results__option[aria-selected]')):
						//console.log('--select2 mouseup');
						el.trigger($.Event( 'mouseup', { which: 1 } ));
					break;
					//otherwise just click
					default:
						el.click();
					break;
				}//switch
			break;
		}//switch
	});
	$(document).ready(function(){
		/*if(!!is.iframe){
			console.log('---menu.js: is iframe');
			//mark as iframe, on select2-container focus, focus back on the parent window so the motion cursor will still work
			$('body').addClass('is-iframe')
				.on('focus.ext','.select2-container,label,input',function(ev){
					//console.log('---select2 focus:');
					window.parent.focus();
				});
			//create the select2 element and hide the search box
			$('select').select2({minimumResultsForSearch:Infinity});
		}//if*/
		
		//get current tab data
		changeTab();

		$(document.body)
			/*.find('section.wgu iframe.wgu')
				.attr('src','https://my.wgu.edu')
			.end()*/
			.on('click','section.nav input[type="checkbox"]',function(ev){
				console.log('---setGoogleSearch checkbox click: '+!!$(this).is(':checked'))
				//for now, this is only the google search option
				connection.postMessage({
					method:'setGoogleSearch',
					value: !!$(this).is(':checked')
				},function(response){
					console.log('---setGoogleSearch resp:');
					console.debug(response);
				});
			})
			//button actions
			.on('click','section.nav button',function(ev){
				ev.preventDefault();
				//console.log('click');console.debug(ev);
				switch(true){
					/*case(!!$(this).is('.tabmess')):
						connection.postMessage({method:'openTabmess'},function(response){
							//console.debug(response);
						});
					break;//*/
					/*case(!!$(this).is('.wgu')):
						//open a popup window with the wgu login page, or reload the one that is currently open
						//-I did this with the mobile popup
						connection.postMessage({method:'openWGU'},function(response){
							//console.debug(response);
						});
					break;*/
					/*case(!!$(this).is('.tabmove')):
						connection.postMessage({method:'moveToWindow'},function(response){
							//console.debug(response);
						});
					break;//*/
					case(!!$(this).is('.wgudark')):
						//toggle dark mode for task submission window
						connection.postMessage({method:'toggleWGUDark'},function(response){
							//console.debug(response);
						});
					break;
					case(!!$(this).is('.copyURL')):
						connection.postMessage({
								method:'copyURL',
								all: !!$(this).is('._all'),
								domain: !!$(this).is('._domain'),
								tabDomain: domain,
								highlighted: !!$(this).is('._highlighted')
							},function(response){
								//console.debug(response);
							});
					break;
					case(!!$(this).is('.reload')):
						connection.postMessage({method:'reloadExt'},function(response){
							//console.debug(response);
						});
					break;
				}//switch
				
				//close the menu/hide the overlay
				_close();
			});
			//cms button click events
			/*.on('click','section.nav button.cms',function(ev){
				ev.preventDefault();
				//console.log('click');console.debug(ev);
				connection.postMessage({method:'cms',site:($(this).attr('data-site')||''),type:($(this).attr('data-type')||''),tabUrl:_tab.url},function(response){
					//console.debug(response);
				});
				//close the menu/hide the overlay
				_close();
			})
			//site nav button click events
			.on('click','section.nav.site button',function(ev){
				ev.preventDefault();
				//console.log('nav click is copy: '+!!$(this).is('.copy'));
				//console.debug(ev);
				var url = createURL();

				if(!!url.nav){
					connection.postMessage({
							method:'nav',
							url: url.url,
							//new: url.target,
							new: !!$(this).is('.new'),
							nav: url.nav,
							tab:_tab,
							//if this is a copy to clipboard button
							//-should probably add some kind of success output for copy
							copy: !!$(this).is('.copy'),
							//prefix:($(this).attr('data-prefix')||''),
							//target:$(this).attr('data-target'),
							//tabUrl:tabUrl,
							//domain:$('.nav.site select.domains').val()
						},function(response){
							//console.debug(response);
						});
					//close the menu/hide the overlay
					_close();
				}//if
			});*/

			//domains select change event
			/*.on('change','section.nav.site select.domains',function(ev){
				//if the value is not blank, then show new tab only, will open to homepage
				//-maybe just leave the default behavior, but use the domain from the dropdown instead
			});*/

		//keyboard shortcut list click events
		//-does not exist in this menu but events still need to be fired sometimes
		//if(false){
			$('.keys-list').on('click','._row',function(ev){
				var $this = $(this),
					ev = Object.assign(...$this.attr('data-modifiers').split(/\s*,\s*/).map(d => ({[d]: true})))
				ev.which = $this.attr('data-which');
				delete ev[''];
				//send tab msg to fire selected event
				connection.tabMessage(_tab.id,{method:'triggerKeysEvent', ev: ev});
				//close the menu
				window.close();
			});//*/
		//}//if
		
		//create a new qr code using the text in the input field
		$('.qrcode button').on('click',function(ev){
			$('.qrcode .qrcode-container').html('').qrcode({
					width: 175,
					height: 175,
					//if this is create, create a new qrcode out of the input value
					//-else reset the value to the tab url
					text: ($(this).attr('data-action') == 'create' && $('.qrcode .qrcode-create').val())
						|| _tab.url
				});
		});
		
		//toggle text case on qr-code create contextmenu on GO
		//-eventually move this to another file along with the relevant prototypes
		var toggleTextCase = function(ev){
			var t, el = $(ev.target);
			/*console.log('toggleTextCase ev:');
			console.debug(ev);
			console.debug(el);//*/
			//if this is just the document, use the active element
			if(!!el.is(document)){
				el = $(document.activeElement);
			}//if*/
			
			//-add tooltip with the state of the text (lower,upper,title,etc)
			//--added extra input because some stupid text fields are not type text, should find another way to test, with selection length?
			if(!!el.is('textarea,input[type="text"],input')){
				t = el.getSelection();
				//eventually extend the select to cover whole words on either end maybe
				//-add thing to ignore html tags, also add to codemirror eventually
				switch(true){
					//if the text has not yet been toggled, or this is different text
					case(!el.data('text-selection') || el.data('text-selection').start != t.start || el.data('text-selection').end != t.end):
						el.data('text-selection',{o:t.text,tc:t.text.toTitleCase(),start:t.start,end:t.end,len:t.length});
						el.replaceSelectedText(t.text.toTitleCase(),'select');
					break;
					//if it has been toggled but not to the title case variant, toggle to the title case variant
					case(!el.data('text-selection').tct):
						el.data('text-selection').tct = t.text.toTitleCase(true);
						el.replaceSelectedText(t.text.toTitleCase(true),'select');
					break;
					//if there are any lowercase letters at this point, make them all uppercase
					case(!el.data('text-selection').up):
						el.data('text-selection').up = t.text.toUpperCaseText();
						el.replaceSelectedText(t.text.toUpperCaseText(),'select');
					break;
					//if there are all uppercase letters at this point, make them all lowercase
					case(!el.data('text-selection').low):
						el.data('text-selection').low = t.text.toLowerCaseText();
						el.replaceSelectedText(t.text.toLowerCaseText(),'select');
					break;
					//else go back to the original
					default:
						el.replaceSelectedText(el.data('text-selection').o,'select');
						el.removeData('text-selection');
					break;
				}//switch
			}//if
		};//func
		
		/*$('.toggle-text.button').on('click',function(ev){
			console.log('---toggle-text button click');//*/
		$('.qrcode button:first').on('contextmenu',function(ev){
			console.log('---qrcode button contextmenu');
			ev.preventDefault();
			$('input.qrcode-create').select();
			toggleTextCase({target:$('input.qrcode-create')});
			return false;
		});

		//populate tab and window counts
		updateTabCount();
		updateWindowCount();
	});
})(jQuery);
