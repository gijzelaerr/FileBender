
/**
 * Attempt to make URL generic
 *
 */
if (!window.URL && window.webkitURL)
	window.URL = window.webkitURL;


/**
 * Helper function to format file size
 *
 */
formatSize = function(size) {
    if(size > 1024 * 1024 * 1024)
        return (Math.round(size * 100 / (1024 * 1024 * 1024)) / 100).toString() + 'GB';
    else if(size > 1024 * 1024)
        return (Math.round(size * 100 / (1024 * 1024)) / 100).toString() + 'MB';
    else
        return (Math.round(size * 100 / 1024) / 100).toString() + 'KB';
}

/**
 * The downloader object, used for the complete download process
 *
 */
var downloader = {
    xhr: new XMLHttpRequest(),   
}	


/**
 * Initialise the download
 *
 */
downloader.start = function(URI, filename) {
    downloader.filename = filename;
    downloader.xhr.addEventListener("progress", downloader.progress, false);
    downloader.xhr.addEventListener("load", downloader.complete, false);
    downloader.xhr.addEventListener("error", downloader.failed, false);
    downloader.xhr.addEventListener("abort", downloader.canceled, false);
	downloader.xhr.open("GET", URI);
	downloader.xhr.send();
};


/**
 * called when the file is completely downloaded
 *
 */
downloader.complete = function (evt) {
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
	saveAs(blob, downloader.filename);
}


/**
 * called to update the progress indicator
 *
 */
downloader.progress = function (evt) {
    if (evt.lengthComputable) {
        var percentComplete = evt.loaded / evt.total;
    } else {
        pass;
    }
}


downloader.failed = function(evt) {
	alert("There was an error attempting to download the file.");
}


downloader.canceled = function(evt) {
	alert("The upload has been canceled by the user or the browser dropped the connection.");
}




/**
 * The uploaded object, used for the complete upload progress
 *
 */
var uploader = {
    completed: 0,
    blockSize: 5000000,
    file: null,
    type: null,
    reader: null,
    plainChunk: null,
    cryptChunk: null,
    cryptBlob: null,
    fileid: null,
    key: null,
    cryptBlobBuilder: null,

    states: {
        READY: 'ready',
        STARTED: 'started',
        PROGRESS: 'progress',
        COMPLETE: 'complete',
        ABORT: 'abort',
        ERROR: 'error'
    },
};


/**
 * Reset the complete upload process
 *
 */
uploader.reset = function() {
    uploader.completed = 0;
    uploader.file = null;
    uploader.type = null;
    uploader.doCrypt = true;
    uploader.plainChunk = null;
    uploader.cryptChunk = null;
    uploader.cryptBlob = null;
    uploader.fileid = null;
    uploader.key = null;
    uploader.blobBuilder = null;
    uploader.state = uploader.states.READY;
}


/**
 * Called when a file is selected
 *
 */
uploader.selected = function() {
	uploader.file = document.getElementById('id_file').files[0];

	if(uploader.file) {
		document.getElementById('fileName').innerHTML = 'Name: ' + uploader.file.name;
		document.getElementById('fileSize').innerHTML = 'Size: ' + formatSize(uploader.file.size);
		document.getElementById('fileType').innerHTML = 'Type: ' + uploader.file.type;
	}
}


/**
 * Initialises the upload progress
 *
 */
uploader.start = function() {
	if(!uploader.file) {
	    alert("no file selected");
	    return;
	}

    uploader.doCrypt = document.getElementById('id_docrypt').checked;

	uploader.key = document.getElementById('id_key').value;
	uploader.state = uploader.states.STARTED;
    uploader.nextChunk();
}


/**
 * Process the next chunk of file data. Should be called when previous chunk is finished
 *
 */
uploader.nextChunk = function() {
    start = uploader.completed;
    end = Math.min(uploader.completed+uploader.blockSize, uploader.file.size);

    // make blob slice generic
    if (uploader.file.mozSlice) { // firefox
        uploader.slice = uploader.file.mozSlice(start, end);
    } else if (uploader.file.webkitSlice) { // chrome
        uploader.slice = uploader.file.webkitSlice(start, end);
    } else {
        alert("cant slice a blob!");
        return;
    }

    uploader.reader = new FileReader();
    uploader.reader.onerror = function(e) { alert(e) };
    uploader.reader.readAsBinaryString(uploader.slice);

    uploader.reader.onload = function(FREvent) {
        uploader.plainChunk = FREvent.target.result;
        if  (uploader.doCrypt)
            uploader.encryptChunk();
        else
            uploader.uploadChunk();

    }
}


/**
 * Encrypt a filechunk
 *
 */
uploader.encryptChunk = function() {
    uploader.cryptChunk = sjcl.encrypt(uploader.key, uploader.plainChunk);
    uploader.cryptBlobBuilder = new BlobBuilder();
    uploader.cryptBlobBuilder.append(uploader.cryptChunk);
    uploader.cryptBlob = uploader.cryptBlobBuilder.getBlob();
    uploader.uploadChunk();
}


/**
 * Send a chunk to the server
 *
 */
uploader.uploadChunk = function() {
    var xhr = new XMLHttpRequest();
    var fd = new FormData();

    xhr.uploader.addEventListener("progress", uploader.uploadProgress, false);
    xhr.addEventListener("load", uploader.uploadComplete, false);
    xhr.addEventListener("error", uploader.uploadFailed, false);
    xhr.addEventListener("abort", uploader.uploadCanceled, false);

    if (uploader.doCrypt)
	    fd.append("file", uploader.cryptBlob);
    else
        fd.append("file", uploader.slice);

    fd.append("csrfmiddlewaretoken",
        document.getElementsByName('csrfmiddlewaretoken')[0].value);

    if(uploader.fileid)
        xhr.open("POST", "/bigfiles/append.json/" + uploader.fileid + "/");
    else
        xhr.open("POST", "/bigfiles/uploader.json/");

	xhr.send(fd);
}


/**
 * Called to update the upload progress indicator
 *
 */
uploader.uploadProgress = function(evt) {
    var newPercent = "??";
	if(evt.lengthComputable) {
		var percentComplete = Math.round((evt.loaded + uploader.completed - uploader.blockSize) * 100 /
		                                                  uploader.file.size);
		newPercent = percentComplete.toString() + '%';
	}
	document.getElementById('progressNumber').innerHTML = newPercent;
}


/**
 * Called when a chunk is uploaded
 *
 */
uploader.uploadComplete = function(evt) {
    // todo: check server http code
	try {
        var response = JSON.parse(evt.target.responseText);
    }catch(e) {
        alert("can't parse server response, upload failed");
        uploader.reset();
        return;
    }

	if(!uploader.fileid) {
	    if (!response['fileid']) {
	       alert("didnt receive a fileID after first chunk");
	       return;
	    }
	    uploader.fileid = response['fileid'];
	}

    uploader.completed = uploader.completed + Math.min(uploader.blockSize, uploader.file.size);

    if(uploader.completed < uploader.file.size) {
        uploader.nextChunk();
    } else {
        alert("upload complete!");
        uploader.reset();
    }

}


uploader.uploadFailed = function(evt) {
	alert("There was an error attempting to upload the file.");
}


uploader.uploadCanceled = function(evt) {
	alert("The upload has been canceled by the user or the browser dropped the connection.");
}



