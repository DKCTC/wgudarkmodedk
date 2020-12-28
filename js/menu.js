(function(){
	//connection to background
	var connection,
		//click event function
		clickEvent = function(ev){
			ev.stopPropagation();
			//toggle enabled class
			ev.target.classList.toggle('enabled');
			//toggle button title
			ev.target.title = 'Click to turn ' + ((!!ev.target.classList.contains('enabled') && 'OFF') || 'ON');
			//send message to background to toggle
			connection.postMessage({method:'event',font:ev.target.name == 'largefont'},function(response){});
		},
		//doc ready function
		ready = function(){
			//establish connection to background
			connection = new Port({ name: 'menu' });
			//listener for background response to modify button appearance
			connection.addPortListener({
				enabled: function(msg, sender, sendResponse){
					//set button highlight and title
					var d = document.querySelectorAll('button[name="darkmode"]')[0], l = document.querySelectorAll('button[name="largefont"]')[0];
					!!msg.enabled.darkmode && d.classList.add('enabled');
					d.title = 'Click to turn '+((!!msg.enabled.darkmode && 'OFF') || 'ON');
					!!msg.enabled.largefont && l.classList.add('enabled');
					l.title = 'Click to turn '+((!!msg.enabled.largefont && 'OFF') || 'ON');
					//set timeout and body ready class for button transitions so that they don't animate on open
					setTimeout(()=>{document.querySelectorAll('body')[0].classList.add('ready');},500);
				}
			});
			//click events for the buttons
			document.querySelectorAll('button').forEach((v,i) => {
				v.addEventListener('click', clickEvent);
			});
		};
	//doc ready
	if (document.readyState === "complete" ||
		(document.readyState !== "loading"
			&& !document.documentElement.doScroll)) {
		ready();
	} else {
		document.addEventListener("DOMContentLoaded", ready);
	}//if
})();