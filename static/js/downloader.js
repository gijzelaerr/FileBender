

/** The downloader object, used for the complete download process
 *
 */
Downloader = function() {
    this.crypted = null;
    this.plainChunk = null;
    this.cryptChunk = null;
    this.filename = null;
    this.fileUrl = null;
    this.key  = null;

    this.byteString = null;
    this.mimeString = null;
    this.chunkSize = chunkSize;
    this.completed = 0;
    this.ranged = true;
    this.fileStorage = null;

    this.xhr = new XMLHttpRequest();

    that = this;
    this.xhr.addEventListener("progress", this.progress, false);
    this.xhr.addEventListener("load", function(evt) { that._requestComplete(evt)}, false);
    this.xhr.addEventListener("error", this.failed, false);
    this.xhr.addEventListener("abort", this.canceled, false);
};


/** Set status for user
 *
 */
Downloader.prototype.setStatus = function(status) {
    document.getElementById('status').innerHTML = 'Status: ' + status;
};


Downloader.prototype.setProgress = function(number) {
    document.getElementById('progressNumber').innerHTML = "" + number + "%";
};


/** Initialise the download. For now you need to specify the filename separately so we can use that for saving
 *
 */
Downloader.prototype.start = function(fileUrl, filename, size) {
    this.key = prompt("Give key used for file encryption", "password");

    this.setStatus("starting download");
    that.setProgress(0);
    this.fileUrl = fileUrl;
    this.filename = filename;
    this.size = size;
    this.completed = 0;
    this.fileStorage = new FileStorage();

    that = this;
    this.fileStorage.onload = function() {
        that._nextDownload();
    };

    this.fileStorage.start(filename, size);
};


/** Download the next cryptChunk
 *
 */
Downloader.prototype._nextDownload = function() {
    this.setStatus("downloading chunk");
    var start = this.completed;
    var end = Math.min(this.completed + cryptLen(base64Len(this.chunkSize)), this.size);
    this.xhr.open("GET", this.fileUrl);
    this.xhr.setRequestHeader("Range", "bytes=" + start + "-" + (end-1));
    this.xhr.send();
};



/** called when the chunk is completely downloaded
 *
 */
Downloader.prototype._requestComplete = function (evt) {
    if (evt.target.status == 200) {
        console.log("server doesn't support range request");
        if (evt.target.response.length != this.size) {
            alert("unexpected response size, expected " + this.size + ",  received " + evt.target.response.length);
            return;
        };
        this.ranged = false;
        this.cryptChunk = evt.target.response;
        this._nextChunk();

    } else if (evt.target.status == 206) {
        var l = cryptLen(base64Len(this.chunkSize));
        if (evt.target.response.length != l) {
            alert("unexpected response size, expected " + l + ", received " + evt.target.response.length);
            return;
        };
        this.cryptChunk = evt.target.response;
        this._decryptChunk();
        this.completed = Math.min(this.completed + cryptLen(base64Len(this.chunkSize)), this.size);
        if(this.completed < this.size) {
            this._nextDownload();
        } else {
            this._final();
        };

    } else {
        alert("server gave an error (" + evt.target.status + ")");
        return;
    };
};


/** Process blob in chunked, used when the HTTP server doesn't support Range
 *
 */
Downloader.prototype._nextChunk = function() {
    var start = this.completed;
    var end = Math.min(this.completed + cryptLen(base64Len(chunkSize)), this.cryptChunk.length);
    this.chunk = this.cryptChunk.slice(start, end);
    this._decryptChunk();

    this.completed = this.end;

    if(this.completed < this.cryptChunk.length) {
        this._nextChunk();
    } else {
        this._final();
    };
};


/** Decrypt a chunk
 *
 */
Downloader.prototype._decryptChunk = function () {

    this.setStatus("decrypting chunk");
    var percentComplete = Math.round(this.completed / this.size * 100);
    that.setProgress(percentComplete);

    var final = this.cryptChunk.charAt(this.cryptChunk.length-1);
    if (final != "}") {
        alert("alignment problem, check chunkSize");
        return;
    }

    try {
        this.plainChunk = sjcl.decrypt(this.key, this.cryptChunk);
    } catch(e) {
        alert("wrong key");
        return;
    };

    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs
    this.byteString = atob(this.plainChunk.split(',')[1]);

    // separate out the mime component
    this.mimeString = this.plainChunk.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(this.byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < this.byteString.length; i++) {
        ia[i] = this.byteString.charCodeAt(i);
    };

    // write the ArrayBuffer to a blob, and you're done
    this.fileStorage.append(ab);
};


/**
 *
 */
Downloader.prototype._final = function() {
    this.setStatus("download complete");
    that.setProgress(100);
    //var blob = this.builder.getBlob(this.mimeString);
    //saveAs(blob, this.filename);
    window.location = this.fileStorage.getUrl();
};


/** called to update the progress indicator
 *
 */
Downloader.progress = function (evt) {
    if (evt.lengthComputable) {
        var percentComplete = evt.loaded / evt.total;
    } else {
        pass;
    };
};


Downloader.failed = function(evt) {
    alert("There was an error attempting to download the file.");
};


Downloader.canceled = function(evt) {
    alert("The upload has been canceled by the user or the browser dropped the connection.");
};



var downloader = new Downloader();