
/**
 * The uploaded object, used for the complete upload progress
 *
 */
uploader = {
    completed: 0,

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
    }
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
    uploader.selected();

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
    var start = uploader.completed;
    var end = Math.min(uploader.completed + chunkSize, uploader.file.size);

    uploader.slice = uploader.file.slice(start, end);

    if (uploader.doCrypt) {
        uploader.reader = new FileReader();
        uploader.reader.onerror = function(e) { alert(e) };
        uploader.reader.readAsDataURL(uploader.slice);

        uploader.reader.onload = function(FREvent) {
            uploader.plainChunk = FREvent.target.result;
            uploader.encryptChunk();
        }
    } else {
        uploader.cryptBlob = uploader.slice;
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

    xhr.addEventListener("progress", uploader.uploadProgress, false);
    xhr.addEventListener("load", uploader.uploadComplete, false);
    xhr.addEventListener("error", uploader.uploadFailed, false);
    xhr.addEventListener("abort", uploader.uploadCanceled, false);

    fd.append("file", uploader.cryptBlob);
    
    fd.append("csrfmiddlewaretoken",
        document.getElementsByName('csrfmiddlewaretoken')[0].value);

    if(uploader.fileid)
        xhr.open("POST", "/bigfiles/append.json/" + uploader.fileid + "/");
    else
        xhr.open("POST", "/bigfiles/upload.json/");


	xhr.send(fd);
}


/**
 * Called to update the upload progress indicator
 *
 */
uploader.uploadProgress = function(evt) {
    var newPercent = "??";
	if(evt.lengthComputable) {
		var percentComplete = Math.round((evt.loaded + uploader.completed - uploader.chunkSize) * 100 /
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

    uploader.completed = uploader.completed + Math.min(chunkSize, uploader.file.size);

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



