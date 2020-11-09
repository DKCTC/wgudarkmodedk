
//add a leading zero to a single digit number
//-NaN is converted to 00
Number.prototype.toLZ = function(){return (((isNaN(this) && '0') || this)+'').replace(/\b(\d)\b/g,'0$1');}

//escape characters when making a new regex
String.prototype.regexpEscape = function(){
	return this.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

//format custom classes on anchors
String.prototype.toAnchorCustomClass = function(){
	return this.replace(/([^\s])((\s)|($))/g,'$1-a$2');
}//func

//string titlecase prototype
//capitalize the first letter of the given string, ignoring HTML tags
//-need to also handle html tags that have dashes in them
String.prototype.toTitleCase = function(f){
	//if f, first letter capital (also capture dollar signs), the rest lowercase, else every word starts with a capital letter
	//^([\w\$])(.*)$
	return (!!f &&
			this.replace(/(?=.*\b[\w$]\w*\b)(?!<*\/*[\w\s="'-]*>)(?=.*\b[\w$]\w*\b)\w+/g, function(txt){ return txt.toLowerCase();})
		//([\s\w]+)(?:<*\/*[\w\s="']*>)*
				.replace(/(?=.*\b[\w$]\w*\b)(?!<*\/*[\w\s="'-]*>)(?=.*\b[\w$]\w*\b)\w/, function(txt){ return txt.toUpperCase();}))
		|| this.replace(/(\w+)(?!<*\/*[\w\s="'-]*>)(\w*)/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}); //\w\S*
		//([^<>\s])(?!([\w\s="']*>))(\S*)
	//return (!!f && this.replace(/^([\w\$])(.*)$/gmi, function(txt){return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();})) ||
}//func

//string uppercase / lowercase text prototype
//make the string uppercase/lowercase except for html tags
String.prototype.toUpperCaseText = function(){
	return this.replace(/(\w+)(?!<*\/*[\w\s="'-]*>)(\w*)/g, function(txt){return txt.toUpperCase();});
}//func
String.prototype.toLowerCaseText = function(){
	return this.replace(/(\w+)(?!<*\/*[\w\s="'-]*>)(\w*)/g, function(txt){return txt.toLowerCase();});
}//func

//put the text into a textarea and return the inner html, which will format the html tags
String.prototype.textHTML = function(){
	var r = document.createElement('textarea');
	r.innerHTML = this;
	return r.innerHTML;
};//func
