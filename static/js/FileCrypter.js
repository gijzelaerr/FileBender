
function FileCrypter() {
    this.logger = console.log;
    this.plainSlice = null;
    this.plainText = null;
    this.cryptText = null;
    this.cryptBlob = null;
    this.fileid = null;

    this.builder = null;

    this.worker = new Worker("/media/js/crypter.js");
    this.worker.onmessage = this._workerResponse;

    this.reader = new FileReader();

    this.reader.onerror = function(e) {
        var errorStr = "unknown";
        switch(e.target.error.code) {
            case 1:
                errorStr = "File not found";
                break;
            case 2:
                errorStr = "Security error";
                break;
            case 3:
                errorStr = "Aborted";
                break;
            case 4:
                errorStr = "Not readable";
                break;
            case 5:
                errorStr = "Encoding error";
                break;
        }
        this.logger("can't read file: "+ errorStr);
        this.onerror();
    };

    var that = this;
    this.reader.onload = function(FREvent) {
        that.plainSlice = FREvent.target.result;
        that._encryptSlice();
    }


    /** Process the next chunk of file data
     * @private
     */
    this._nextChunk = function() {
        var start = this.completed;
        var end = Math.min(this.completed + this.chunkSize, this.file.size);

        if (end == this.chunkSize || this.chunkSize == 0) {
            this.plainSlice = this.file;
        } else {
            this.plainSlice = uploader.file.slice(start, end);
        };

        // TODO: chrome and firefox prepend a different encoding string length
        this.reader.readAsDataURL(this.plainSlice);
    };


    /** encrypt a slice
     *  @private
     */
    this._encryptSlice = function() {
        this.worker.postMessage({'key': this.key, 'data': this.plainSlice});
    };


    /** called when a worker has something to say
     *  @private
     */
    var _workerResponse = function(msg) {
        switch(msg.data['status']) {
            case 'ok':
                this.cryptChunk = msg.data['data'];
                this._cryptFinished();
                break;
            case 'debug':
                this.logger("cryptWorker: " + e.data['message']);
                break;
            case 'error':
                this.logger("cryptWorker: " + e.data['message']);
                break;
            default:
                this.logger("cryptWorker: " + e.data.toString());
                break;
        };
    };

    /** Called when the cryptWorker is finished encrypting
     * @private
     */
    var _cryptFinished = function() {
        var BlobBuilder = self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder;
        this.builder = new BlobBuilder();
        this.builder.append(this.cryptChunk);
        this.cryptBlob = uploader.builder.getBlob();

        this.completed = Math.min(this.file.size, this.completed + this.chunkSize);
        
        // notify the developer using this library
        this.onchunkready();

        if(this.completed < this.file.size) {
            this._nextChunk();
        } else {
            this.oncrypt();
            this.oncryptend();
        };
    };
};


 /** Encrypt a file
  * @param {File} file the file object to encrypt
  * @param {String} key the key used to encrypt the file
  * @param {int} [chunkSize] when defined the File will be split into chunks of size chunkSize. default is 5MB. When set to 0 the file will not be chunked.
  */
FileCrypter.prototype.crypt = function(file, key, chunkSize) {
    this.file = file;
    this.key = key;
    this.chunkSize = chunkSize || (5 * 1024 * 1024);
    this.completed = 0;

    // making the slice generic between different browser vendors
    this.file.slice = this.file.mozSlice || this.file.webkitSlice || this.file.slice;

    this._nextChunk();
};



 /** Abort current encryption
  */
FileCrypter.prototype.abort = function() {};


/** Called when the crypt operation is aborted.
 *
 */
FileCrypter.prototype.onabort = function() {};


/** Called when an error occurs.
 *
 */
FileCrypter.prototype.onerror = function() {};


/** Called when the crypt operation is successfully completed.
 *
 */
FileCrypter.prototype.oncrypt = function() {};


/** Called when a chunk is encrypted and ready for whatever you want to do with it
 */
FileCrypter.prototype.onchunkready = function() {};


/** Called when the crypting is completed, whether successful or not. This is called after either oncrypt or onerror.
 *
 */
FileCrypter.prototype.oncryptend = function() {};


/**Called when crypting the data is about to begin.
 *
 */
FileCrypter.prototype.oncryptstart = function() {};


/**Called periodically while the data is being crypted.
 *
 */
FileCrypter.prototype.onprogress = function() {};
