

function BlobCrypter() {
    this.logger = function () { console.log.apply(console, arguments); };
    this.plainText = null;
    this.cryptText = null;
    this.cryptBlob = null;
    this.builder = null;
    this.error = null;

    this.worker = new Worker("/media/js/CryptWorker.js");
    this.reader = new FileReader();

    // below are all callback functions. we need the that = this trick to access BlobCrypter
    var that = this;


    /** callback called when a worker has something to say
     *  @private
     */
    this.worker.onmessage = function(msg) {
        switch(msg.data['status']) {
            case 'ok':
                that.cryptText = msg.data['data'];
                that._cryptFinished();
                break;
            case 'debug':
                console.log("cryptWorker: " + msg.data['message']);
                break;
            case 'error':
                console.log("cryptWorker: " + msg.data['message']);
                break;
            default:
                console.log("cryptWorker: " + msg.data.toString());
                break;
        };
    };


    /** callback called when there is a worker error
     *  @private
     */
    this.worker.onerror = function(e) {
        that.logger("webworker error: " + e.message);
    };


    /** callback called when there is a read error
     *  @private
     */
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
        that.logger("can't read file: "+ errorStr);
        that.onerror();
    };


    /** callback called when read is finished
     *  @private
     */
    this.reader.onload = function(FREvent) {
        that.plainText = FREvent.target.result;
        that._encryptBlob();
    };
};


/** encrypt the plain data
 *  @private
 */
BlobCrypter.prototype._encryptBlob = function() {
        this.worker.postMessage({'key': this.key, 'data': this.plainText});
};


/** called when the cryptWorker is finished encrypting
 * @private
 */
BlobCrypter.prototype._cryptFinished = function() {
    var BlobBuilder = self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder;
    this.builder = new BlobBuilder();
    this.builder.append(this.cryptText);
    this.cryptBlob = this.builder.getBlob();

    this.oncrypt();
    this.oncryptend();
};


/** Encrypt a file
 * @param {File} file the file object to encrypt
 * @param {String} key the key used to encrypt the file
 * @param {int} [chunkSize] when defined the File will be split into chunks of size chunkSize. default is 5MB. When set to 0 the file will not be chunked.
 */
 BlobCrypter.prototype.crypt = function(file, key) {
    this.file = file;
    this.key = key;

     if (!(this.file instanceof Blob)) {
         this.error ="no file!";
         this.onerror();
         return;
     };

     if (!(this.key.constructor === String) || this.key.length == 0) {
         this.error ="no key!";
         this.onerror();
         return;
     };

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
BlobCrypter.prototype.onerror = function() {
    console.log(this.error);
};


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
