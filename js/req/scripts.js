
//script that checks urls and adds content scripts so that the extension won't have to be reloaded to test changes

(function($){

	_connections.scripts = new Port({name: 'scripts'});

	console.log('---scripts.js loaded:');

	var scripts = [],
		href = window.location.href,
		vimeo = /player\.vimeo\.com\/video/gi,
		youtube = /youtube\.com\//gi,
		googleSearch = /google\.com\/search/gi,
		wgutask = /tasks\.wgu\.edu/gi,
		is = {
			wgutask: !!wgutask.test(href)
		},
		prefs = {
			googleSearchNewTabs: false
		};
	
	//-will not pick up broadcast or port messages from background outside of init for some reason
	_connections.scripts.addPortListener({
		getGoogleSearch: function(msg, sender, sendResponse){
			console.log('-scripts.js port getGoogleSearch received: '+msg.value.googleSearchNewTabs);
			console.debug(msg);
			prefs.googleSearchNewTabs = msg.value.googleSearchNewTabs;
		},
		test: function(msg, sender, sendResponse){
			console.log('-scripts.js port TEST received:');
			console.debug(msg);
		}
	});//*/
	_connections.scripts.addBroadcastListener({
		_getGoogleSearch: function(msg, sender, sendResponse){
			console.log('-scripts.js broadcast getGoogleSearch received: '+msg.value.googleSearchNewTabs);
			console.debug(msg);
			prefs.googleSearchNewTabs = msg.value.googleSearchNewTabs;
		},//
		_test: function(msg, sender, sendResponse){
			console.log('-scripts.js broadcast TEST received:');
			console.debug(msg);
		},
		toggleWGUDark: function(msg, sender, sendResponse){
			console.log('-scripts.js toggleWGUDark received: is.wgutask: '+!!is.wgutask);
			console.debug(msg);
			!!is.wgutask && $('html').toggleClass('dkcce dark-mode large-font');
		}
	});//*/
	//--------- include scripts ---------
	//-also run scripts that don't need to have their own files (yet)
	switch(true){
		//if this is a google search page, add the new tab thing
		//-removing for now because the checkbox does not update all tabs for some reason
		case(false):
		//case(!!googleSearch.test(href)):
			console.log('---adding the google search links in new tab function');
			$(document.body).off('click')
				.on('click','a[data-ctbtn]:not([target])',function(ev){
					if(!!prefs.googleSearchNewTabs){
						ev.preventDefault();
						$(ev.target).closest('a').attr('target','_blank')[0].click();
						return false;
					}//if
				});
		break;
		case(false):
		//case(!!vimeo.test(href)):
			console.log('------- is vimeo frame:');
			//console.debug(document.getElementsByTagName('script')[0].innerHTML.match(/"http[^"]*\.mp4"/gi));
			//console.debug(document);
			//console.debug($(document.body).children('script'));
			//console.debug($(document.body).children('script:first')[0].innerHTML
			//	.match(/"progressive":(\[[^\]]*\])/gi)[0]);
			//console.debug(
			var vu = JSON.parse($(document.body).children('script:first')[0].innerHTML
				.match(/"progressive":(\[[^\]]*\])/gi)[0].replace(/^"progressive":/gi,''));
			//	);
			window.__vu = vu;
				//.match(/"width":(\d+),.*"url":"(http[^"]*\.mp4)"/gi));
			var h = '';//'<div class="vidlist" style="position:fixed; left:50px; bottom:50px; width:400px; height:400px;">'
			//var obj = [];
			$.each(vu,function(i,v){

				h += '<h2 style="font-size: large !important;"><a href="'+v.url+'" target="_blank">'+v.quality+' in new tab</a></h2>';

				/*chrome.contextMenus.create({
					title:'Vimeo '+v.quality,
					onclick: function(obj,tab){
						chrome.tabs.create({url: v.url, index: tab.index });
					}
				});*/
				//obj.push({ title: 'Vimeo '+v.quality, url: v.url });

			});
			//console.debug(h);
			//console.debug(obj);
			//h += '</div>';
			setTimeout(function(){
				console.debug($(document.body).find('header.vp-title-header .headers'));
				$(document.body).find('header.vp-title-header .headers').append(h);
			},1000);

			/*_connections.scripts.postMessage({
					method: 'addContextMenuItems',
					items: obj
				}, function(resp){
					//do something
				});*/

		break;
		/*case(!!youtube):
			//add the ytaudio keys events
			window._ytaudio = false;
			console.log('------- is youtube:');
			var ytAudioKeys = {
				118: { //F7 / alt + F7
					modifiers: [],
					shortcut:'F7',
					title: 'Play YouTube Audio Only',
					desc: 'Replace YouTube video with audio stream',
					callback: function(ev){
						if(!window._ytaudio){
							window._ytaudio = true;
						//if(!ev.altKey){
							//_connections.keys.postMessage({ method: 'openTabman' });
							var vid = $('video:first')[0],
								_src = $('[data-audio-url]:first').addClass('dk-ytaudio-only').attr('data-audio-url');
							vid.pause();
							vid._time = vid.currentTime;
							vid.src = _src;
							vid.currentTime = vid._time || 0;
							vid.play();
						//} else {
							//rename tab
							//var r = prompt('Enter new name for tab:');
							//document.title = r;
						}//if
					}
				}//*/
				//blank obj for future additions
				/*1: { //
					modifiers: [ 'altKey' ],
					shortcut:'',
					title: '',
					desc: '',
					callback: function(ev){  }
				},* /
			};
			//add these keydown events to the existing keydown event data obj
			//-uses an array so that content scripts can add their own keydown events
			//-and so that the same key can be reused with different (or not) modifiers (like F7 for tab manager and incrementReload in production.js)
			$(document).data('ext-key-list',($(document).data('ext-key-list') || []).concat([ytAudioKeys]));
		break;
		//if this is a prod site and not the cms or tools pages
		/*case(!!is.prod && !is.cms):
			scripts.push('js/prod.js');
			//scripts = [...scripts,'js/req/jquery.commonparent.js','js/req/jquery.svghighlight.js','js/prod.js'];
		break;*/
	}//switch

	
	//if there are scripts to add, add them
	/*if(!!scripts.length){
		console.log('---scripts.js: adding scripts: '+scripts.join(','));
		//add multiple scripts, requires array of filenames
		_connections.scripts.postMessage({
				method: 'addScripts',
				scripts: scripts
			}, function(resp){
				//do something
			});
	} else {
		console.log('---scripts.js: no additional scripts required');
	}//if*/

	//add single script, requires path and filename
	/*_connections.scripts.postMessage({
			method: 'addScript',
			filename: options.callback
		}, function(response){
			//console.log('addScript response:');
			//console.debug(response);
			/*console.debug(window);
			//console.log('name: '+response[0].name);
			console.debug(response[0]);* /
				
			//callback script must have anonymous function that returns { name: <name of callback function> }
			//-and assigns it to the window object
			//-and accepts the modal and the type as arguments
			//var callback = window[response[0].name] || function(){};
			//callback(modals[type],type);
		});*/
})(jQuery);

/* -old manifest entry for prod.js
    {
      "matches": ["*://*.laserspineinstitute.com/*"],
      "js": [ "js/prod.js" ]
    }
*/
