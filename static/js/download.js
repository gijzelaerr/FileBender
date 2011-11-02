
if (!window.URL && window.webkitURL)
	window.URL = window.webkitURL;


var download = {
    xhr: new XMLHttpRequest(),   
}	


download.xhr.addEventListener("progress", download.progress, false);  
download.xhr.addEventListener("load", download.complete, false);
download.xhr.addEventListener("error", download.failed, false);
download.xhr.addEventListener("abort", download.canceled, false);


download.start = function(URI) {
	xhr.open("GET", URI);
	xhr.send();
}


download.complete = function (evt) {
	//todo: check for server response errors etc
	
	var builder = new BlobBuilder();
	var key = prompt("Give key used for file encryption", "password");
	try {
		var plain = sjcl.decrypt(key, evt.target.response);	
	} catch(e) {
		alert("wrong key");
		return;
	}
	
    var byteArray = new Uint8Array(plain.length);
    for (var i = 0; i < plain.length; i++) {
        byteArray[i] = plain.charCodeAt(i) & 0xff;
    }
	
	builder.append(byteArray.buffer);
	blob = builder.getBlob();
	saveAs(blob, "bla");
	//url = window.URL.createObjectURL(blob);
	//window.location = url;
}

 
download.progress = function (evt) {  
    if (evt.lengthComputable) {  
        var percentComplete = evt.loaded / evt.total;  
    } else {  
        pass;
    }  
}  


download.failed = function(evt) {
	alert("There was an error attempting to download the file.");
}


download.canceled = function(evt) {
	alert("The upload has been canceled by the user or the browser dropped the connection.");
}
