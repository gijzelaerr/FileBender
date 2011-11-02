


formatSize = function(size) {
    if(size > 1024 * 1024 * 1024)
        return (Math.round(size * 100 / (1024 * 1024 * 1024)) / 100).toString() + 'GB';
    else if(size > 1024 * 1024)
        return (Math.round(size * 100 / (1024 * 1024)) / 100).toString() + 'MB';
    else
        return (Math.round(size * 100 / 1024) / 100).toString() + 'KB';
}


var upload = {
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



upload.reset = function() {
    upload.completed = 0;
    upload.file = null;
    upload.type = null;
    upload.doCrypt = true;
    upload.plainChunk = null;
    upload.cryptChunk = null;
    upload.cryptBlob = null;
    upload.fileid = null;
    upload.key = null;
    upload.blobBuilder = null;
    upload.state = upload.states.READY;
}


upload.selected = function() {
	upload.file = document.getElementById('id_file').files[0];

	if(upload.file) {
		document.getElementById('fileName').innerHTML = 'Name: ' + upload.file.name;
		document.getElementById('fileSize').innerHTML = 'Size: ' + formatSize(upload.file.size);
		document.getElementById('fileType').innerHTML = 'Type: ' + upload.file.type;
	}
}


upload.start = function() {
	if(!upload.file) {
	    alert("no file selected");
	    return;
	}

    upload.doCrypt = document.getElementById('id_docrypt').checked;

	upload.key = document.getElementById('id_key').value;
	upload.state = upload.states.STARTED;
    upload.nextChunk();
}


upload.nextChunk = function() {
    start = upload.completed;
    end = Math.min(upload.completed+upload.blockSize, upload.file.size);

    // make blob slice generic
    if (upload.file.mozSlice) { // firefox
        upload.slice = upload.file.mozSlice(start, end);
    } else if (upload.file.webkitSlice) { // chrome
        upload.slice = upload.file.webkitSlice(start, end);
    } else {
        alert("cant slice a blob!");
        return;
    }

    upload.reader = new FileReader();
    upload.reader.onerror = function(e) { alert(e) };
    upload.reader.readAsBinaryString(upload.slice);

    upload.reader.onload = function(FREvent) {
        upload.plainChunk = FREvent.target.result;
        if  (upload.doCrypt)
            upload.encryptChunk();
        else
            upload.uploadChunk();

    }
}


upload.encryptChunk = function() {
    upload.cryptChunk = sjcl.encrypt(upload.key, upload.plainChunk);
    upload.cryptBlobBuilder = new BlobBuilder();
    upload.cryptBlobBuilder.append(upload.cryptChunk);
    upload.cryptBlob = upload.cryptBlobBuilder.getBlob();
    upload.uploadChunk();
}


upload.uploadChunk = function() {
    var xhr = new XMLHttpRequest();
    var fd = new FormData();

    xhr.upload.addEventListener("progress", upload.uploadProgress, false);
    xhr.addEventListener("load", upload.uploadComplete, false);
    xhr.addEventListener("error", upload.uploadFailed, false);
    xhr.addEventListener("abort", upload.uploadCanceled, false);

    if (upload.doCrypt)
	    fd.append("file", upload.cryptBlob);
    else
        fd.append("file", upload.slice);

    fd.append("csrfmiddlewaretoken",
        document.getElementsByName('csrfmiddlewaretoken')[0].value);

    if(upload.fileid)
        xhr.open("POST", "/bigfiles/append.json/" + upload.fileid + "/");
    else
        xhr.open("POST", "/bigfiles/upload.json/");

	xhr.send(fd);
}


upload.uploadProgress = function(evt) {
    var newPercent = "??";
	if(evt.lengthComputable) {
		var percentComplete = Math.round((evt.loaded + upload.completed - upload.blockSize) * 100 /
		                                                  upload.file.size);
		newPercent = percentComplete.toString() + '%';
	}
	document.getElementById('progressNumber').innerHTML = newPercent;
}


upload.uploadComplete = function(evt) {
    // todo: check server http code
	try {
        var response = JSON.parse(evt.target.responseText);
    }catch(e) {
        alert("can't parse server response, upload failed");
        upload.reset();
        return;
    }

	if(!upload.fileid) {
	    if (!response['fileid']) {
	       alert("didnt receive a fileID after first chunk");
	       return;
	    }
	    upload.fileid = response['fileid'];
	}

    upload.completed = upload.completed + Math.min(upload.blockSize, upload.file.size);

    if(upload.completed < upload.file.size) {
        upload.nextChunk();
    } else {
        alert("upload complete!");
        upload.reset();
    }

}


upload.uploadFailed = function(evt) {
	alert("There was an error attempting to upload the file.");
}


upload.uploadCanceled = function(evt) {
	alert("The upload has been canceled by the user or the browser dropped the connection.");
}



