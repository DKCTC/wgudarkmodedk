
//keydown events for all pages
//-these are universal keyboard shortcuts

console.log('keys.js loaded:');
//set to true in the console to enable console logging of the event, good for finding key codes
window._keys = false;

//(function($){
	//open port to background script
	_connections.keys = new Port({name: 'keys'});
	var keysPort = _connections.keys.actual,
		//toggle case of selected text between original and both title cases
		toggleTextCase = function(ev){
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
		},//func
		//current page url
		href = window.location.href;

	//broadcast listeners used to retrieve the tab's keyboard shortcuts and to execute their functions from the browseractionmenu
	_connections.keys.addBroadcastListener({
		'getKeysList': function(msg, sender, sendResponse) {
			//console.log('@@@@ getScrollTop: '+$(window).scrollTop());
			sendResponse($(document).data('ext-key-list'));
		},
		'triggerKeysEvent': function(msg, sender, sendResponse) {
			msg.ev.type = 'keydown';
			//{ type : 'keydown', which : 82, altKey: true }
			//console.log('triggerKeysEvent ev:');
			//console.debug(msg.ev);

			$.event.trigger(msg.ev);
		}
	});
	
	//keyboard shortcut object that is used by browseractionmenu to list the keyboard shortcuts and provide a clickable list
	var keys = {
		87: { //alt + w
			modifiers: [ 'altKey' ],
			shortcut:'Alt + w',
			title: 'Duplicate tab',
			desc: 'Open a copy of this page in a new tab',
			callback: function(ev){
				console.log('--- alt + w: clone tab');
				_connections.keys.postMessage({ method:'nav',clone:true }, function(resp){
					return true;
				});
			}
		},
		85: { //alt + u
			modifiers: [ 'altKey' ],
			shortcut:'Alt + u',
			title: 'Toggle text case', //(upper, lower, title, etc)
			desc: 'Toggle case of selected editable text', //Toggle the case of the text selected in text input fields
			callback: toggleTextCase
		},
		117: { //F6
			modifiers: [],
			shortcut:'F6',
			title: 'Rename tab',
			desc: 'Renames the tab in the titlebar', //so that the name appears in the
			callback: function(ev){
				//rename tab
				var r = prompt('Enter new name for tab:');
				document.title = r;

				_connections.keys.postMessage({ method: 'renameTab', txt: r, href: window.location.href }, function(resp){
					console.debug(resp);
				});
			}
		},
		//movetowindow and cycle keydown events
		90: { //alt + z
			modifiers: [ 'altKey' ],
			shortcut:'Alt + z',
			title: 'moveToWindow', //Move tab and all child tabs to new window
			desc: 'Moves the tab family to its own window',
			callback: function(ev){
				//move brief and all tied preview tabs and the parent opening tab into a new window
				//-parent preview tab, brief, child preview tabs
				_connections.keys.postMessage({ method: 'moveToWindow' });
			}
		},
		/*113: { //F2, shift + F2
			modifiers: [],
			shortcut:'F2',//, Shift + F2',
			title: 'Cycle through tab family',
			desc: 'Cycle through all tabs in the tab family',
			callback: function(ev){
				//cycle through all of the preview tabs spawned by this tab
				_connections.keys.postMessage({ method: 'cycleFamilyTabs' });
				
			}
		},//*/
		/*118: { //F7 / alt + F7
			modifiers: [],
			shortcut:'F7',
			title: 'Open Tab Mess',
			desc: 'Open the Tab Mess page',
			callback: function(ev){
				if(!ev.altKey){
					_connections.keys.postMessage({ method: 'openTabman' });
				//} else {
					//rename tab
					//var r = prompt('Enter new name for tab:');
					//document.title = r;
				}//if
			}
		}*/
		//blank obj for future additions
		/*1: { //
			modifiers: [ 'altKey' ],
			shortcut:'',
			title: '',
			desc: '',
			callback: function(ev){  }
		},*/
	};
	
	//add these keydown events to the existing keydown event data obj
	//-uses an array so that content scripts can add their own keydown events
	//-and so that the same key can be reused with different (or not) modifiers (like F7 for tab manager and incrementReload in production.js)
	$(document).data('ext-key-list',($(document).data('ext-key-list') || []).concat([keys]));

	//global keydown events
	$(window).on('keydown',function(ev){
		//log the key information if _kdd is true, which must be set manually in the dev console
		if(!!window._keys){
			console.log('keys.js: '+ev.which+' | '+ev.key);
			console.debug(ev);
		}//if
		//console.log('>>> production.js keydown: '+ev.which);
		//console.debug(ev);
		
		//loop through the ext-key-list array
		//if there is an event for this key and all of the correct modifiers are being pressed
		//-and this is not a dev function, or it is and this is a dev version
		//-fire the callback
		($(document).data('ext-key-list') || []).forEach(function(_events,idx){
			//console.debug(_events);
			if(!!_events[ev.which]
				&& (!_events.dev || !!isDev)
				&& _events[ev.which].modifiers.filter((v,i) => (ev[v] || false)).length == _events[ev.which].modifiers.length){
				//console.log('>>>> do callback');
				_events[ev.which].callback(ev);
			}//if
		});
	});
//})(jQuery);
/*
	-commands manifest, not used
	"commands": {
		"quickrevise2": {
			"suggested_key": {
				"default": "Ctrl+Shift+K"
			},
			"description": "Quick Revise"
		},
		"_execute_browser_action": {
			"suggested_key": {
				"default": "Ctrl+Shift+Y"
			}
		}
	},

*/