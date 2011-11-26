
function BlobCrypter() {
    this.logger = console.log;
    this.plainText = null;
    this.cryptText = null;
    this.cryptBlob = null;
    this.builder = null;

    this.worker = new Worker("/media/js/CryptWorker.js");
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
        that.plainText = FREvent.target.result;
        that._encryptBlob();
    }


    /** encrypt the plain data
     *  @private
     */
    this._encryptBlob = function() {
        this.worker.postMessage({'key': this.key, 'data': this.plainText});
    };


    /** called when a worker has something to say
     *  @private
     */
    var _workerResponse = function(msg) {
        switch(msg.data['status']) {
            case 'ok':
                this.cryptText = msg.data['data'];
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
        this.builder.append(this.cryptText);
        this.cryptBlob = uploader.builder.getBlob();

        this.oncrypt();
        this.oncryptend();
    };
};


/** Encrypt a file
 * @param {File} file the file object to encrypt
 * @param {String} key the key used to encrypt the file
 * @param {int} [chunkSize] when defined the File will be split into chunks of size chunkSize. default is 5MB. When set to 0 the file will not be chunked.
 */
BlobCrypter.prototype.crypt = function(file, key) {
    this.file = file;
    this.key = key;

    // TODO: chrome and firefox prepend a different encoding string length
    this.reader.readAsDataURL(this.file);
};



/** Abort current encryption
 */
BlobCrypter.prototype.abort = function() {};


/** Called when the crypt operation is aborted.
 *
 */
BlobCrypter.prototype.onabort = function() {};


/** Called when an error occurs.
 *
 */
BlobCrypter.prototype.onerror = function() {};


/** Called when the crypt operation is successfully completed.
 *
 */
BlobCrypter.prototype.oncrypt = function() {};


/** Called when the crypting is completed, whether successful or not. This is called after either oncrypt or onerror.
 *
 */
BlobCrypter.prototype.oncryptend = function() {};


/**Called when crypting the data is about to begin.
 *
 */
BlobCrypter.prototype.oncryptstart = function() {};


/**Called periodically while the data is being crypted.
 *
 */
BlobCrypter.prototype.onprogress = function() {};
