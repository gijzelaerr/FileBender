
/**
 * The uploaded object, used for the complete upload progress
 *
 */
uploader = {
    file: null,
    completed: 0,
    doCrypt: true,
    slicer: new BlobSlicer(),
    cryptBlob: null,
    fileid: null,
    key: null,


    /** Called when a file is selected
     *
     */
    selected: function() {
        this.file = document.getElementById('id_file').files[0];

        if(this.file) {
            document.getElementById('fileName').innerHTML = 'Name: ' + this.file.name;
            document.getElementById('fileSize').innerHTML = 'Size: ' + formatSize(this.file.size);
            document.getElementById('fileType').innerHTML = 'Type: ' + this.file.type;
        }
    },


    /** Set status for user
     *
     */
    setStatus: function(status) {
        document.getElementById('status').innerHTML = 'Status: ' + status;
    },


    /*Initialises the upload progress
     *
     */
    start: function() {
        this.selected();
        this.setStatus("Upload started");

        if(!this.file) {
            alert("no file selected");
            return;
        };

        this.crypter = new BlobCrypter();

        that = this;
        this.crypter.oncrypt = function() {
            that.cryptBlob = this.cryptBlob;
            that.uploadChunk();
        };

        this.slicer.onslice = function() {
            that.crypter.crypt(this.blobSlice);
        };

        this.slicer.onfinish = function() {
            that.setStatus("done");
            alert("upload complete!");
        };

        this.slicer.read(this.file);
    },


    /** Send a chunk to the server
     *
     */
    uploadChunk: function() {
        this.setStatus("Uploading file chunk");
        var xhr = new XMLHttpRequest();
        var fd = new FormData();

        xhr.addEventListener("progress", this.uploadProgress, false);
        xhr.addEventListener("load", this.uploadComplete, false);
        xhr.addEventListener("error", this.uploadFailed, false);
        xhr.addEventListener("abort", this.uploadCanceled, false);

        fd.append("file", this.cryptBlob);

        // needed for django cross site scripting prevention
        fd.append("csrfmiddlewaretoken", document.getElementsByName('csrfmiddlewaretoken')[0].value);

        if(this.fileid) {
            xhr.open("POST", "/bigfiles/append.json/" + this.fileid + "/");
        } else {
            xhr.open("POST", "/bigfiles/upload.json/");
        }
        xhr.send(fd);
    },


    /** Called to update the upload progress indicator
     *
     */
    uploadProgress: function(evt) {
        var newPercent = "??";
        if(evt.lengthComputable) {
            var total = cryptLen(base64Len(uploader.file.size));
            var progress = cryptLen(base64Len(uploader.completed)) + evt.loaded;
            var percentComplete = Math.round((progress * 100 )/ total);
            newPercent = percentComplete.toString() + '%';
        }
        document.getElementById('progressNumber').innerHTML = newPercent;
    },


    /** Called when a chunk is uploaded
     *
     */
    uploadComplete: function(evt) {
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
    },


    uploadFailed: function(evt) {
        alert("There was an error attempting to upload the file.");
    },


    uploadCanceled: function(evt) {
        alert("The upload has been canceled by the user or the browser dropped the connection.");
    }
};


