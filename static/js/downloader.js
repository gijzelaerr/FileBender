

/**
 * The downloader object, used for the complete download process
 *
 */
downloader = {
    xhr: new XMLHttpRequest(),
    builder: new BlobBuilder(),
    crypted: null,
    plain: null,
    chunk: null,
    filename: null,
    key: null,
    completed: 0,
    byteString: null,
    mimeString: null
}


/**
 * Reset the complete download process
 *
 */
downloader.reset = function() {
    this.xhr = new XMLHttpRequest();
    this.builder = new BlobBuilder();
    this.crypted = null;
    this.plain = null;
    this.chunk = null;
    this.filename = null;
    this.key = null;
    this.completed = 0;
}


/**
 * Initialise the download. For now you need to specify the filename separately so we can use that for saving
 *
 */
downloader.start = function(URI, filename) {
    this.reset();
    this.key = prompt("Give key used for file encryption", "password");
    this.filename = filename;
    this.xhr.addEventListener("progress", this.progress, false);
    this.xhr.addEventListener("load", this.complete, false);
    this.xhr.addEventListener("error", this.failed, false);
    this.xhr.addEventListener("abort", this.canceled, false);
    this.xhr.open("GET", URI);
    this.xhr.send();
};


/**
 * called when the file is completely downloaded
 *
 */
downloader.complete = function (evt) {
    //todo: check for server response errors etc
    downloader.crypted = evt.target.response;
    this.completed = 0;
    downloader.nextChunk();
};


/**
 * process the next chunk of data
 *
 */
downloader.nextChunk = function() {
    var start = this.completed;
    var end = Math.min(downloader.crypted.length, this.completed + cryptLen(base64Len(chunkSize)));

    if (this.crypted.length == end && start == 0) {
        // don't slice if not chunked
        this.chunk = this.crypted;
    } else{
        this.chunk = this.crypted.slice(start, end);
    }

    var final = this.chunk.charAt(this.chunk.length-1);
    if (final != "}") {
        alert("alignment problem, check chunkSize");
        return;
    }

    try {
        this.plain = sjcl.decrypt(this.key, this.chunk);
    } catch(e) {
        alert("wrong key");
        return;
    }

    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs
    this.byteString = atob(this.plain.split(',')[1]);

    // separate out the mime component
    this.mimeString = this.plain.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(this.byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < this.byteString.length; i++) {
        ia[i] = this.byteString.charCodeAt(i);
    }

    // write the ArrayBuffer to a blob, and you're done
    this.builder.append(ab);

    this.completed = this.completed + Math.min(cryptLen(base64Len(chunkSize)), this.crypted.length);

    if(this.completed < this.crypted.length) {
        this.nextChunk();
    } else {
        this.final();
    }
};


downloader.final = function() {
    var blob = this.builder.getBlob(this.mimeString);
    saveAs(blob, this.filename);
};


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
};


downloader.failed = function(evt) {
    alert("There was an error attempting to download the file.");
};


downloader.canceled = function(evt) {
    alert("The upload has been canceled by the user or the browser dropped the connection.");
};


