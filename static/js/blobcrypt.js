BlobCrypter = function(cryptFn, chunkSize) {
 
  this.cryptFn_ = cryptFn;
  this.blob_ = null;
  this.crypted_ = null;
  this.bytesProcessed_ = 0;
  this.blockSize_ = opt_blockSize || 5000000;
  this.fileReader_ = null;
  this.logger_ = console.log
};



BlobCrypt.EventType = {
  STARTED: 'started',
  PROGRESS: 'progress',
  COMPLETE: 'complete',
  ABORT: 'abort',
  ERROR: 'error'
};


BlobCrypt.crypt = function(blob) {
  this.abort();
  this.hashFn_.reset();
  this.blob_ = blob;
  this.hashVal_ = null;
  this.bytesProcessed_ = 0;
  this.dispatchEvent(goog.crypt.BlobHasher.EventType.STARTED);

  this.processNextBlock_();
};


BlobCrypt.abort = function() {
  if (this.fileReader_ &&
      this.fileReader_.readyState != this.fileReader_.DONE) {
    this.fileReader_.abort();
  }
};


BlobCrypt.prototype.getBytesProcessed = function() {
  return this.bytesProcessed_;
};


BlobCrypt.getResult = function() {
  return this.hashVal_;
};


BlobCrypt.processNextBlock_ = function() {
  goog.asserts.assert(this.blob_, 'The blob has disappeared during processing');
  if (this.bytesProcessed_ < this.blob_.size) {
    // We have to reset the FileReader every time, otherwise it fails on
    // Chrome, including the latest Chrome 12 beta.
    // http://code.google.com/p/chromium/issues/detail?id=82346
    this.fileReader_ = new FileReader();
    this.fileReader_.onload = goog.bind(this.onLoad_, this);
    this.fileReader_.onabort = goog.bind(this.dispatchEvent, this,
                                         goog.crypt.BlobHasher.EventType.ABORT);
    this.fileReader_.onerror = goog.bind(this.dispatchEvent, this,
                                         goog.crypt.BlobHasher.EventType.ERROR);

    var size = Math.min(this.blob_.size - this.bytesProcessed_,
                        this.blockSize_);
    var chunk = goog.fs.sliceBlob(this.blob_, this.bytesProcessed_,
                                  this.bytesProcessed_ + size);
    if (!chunk || chunk.size != size) {
      this.logger_.severe('Failed slicing the blob');
      this.dispatchEvent(goog.crypt.BlobHasher.EventType.ERROR);
      return;
    }

    if (this.fileReader_.readAsArrayBuffer) {
      this.fileReader_.readAsArrayBuffer(chunk);
    } else if (this.fileReader_.readAsBinaryString) {
      this.fileReader_.readAsBinaryString(chunk);
    } else {
      this.logger_.severe('Failed calling the chunk reader');
      this.dispatchEvent(goog.crypt.BlobHasher.EventType.ERROR);
    }
  } else {
    this.hashVal_ = this.hashFn_.digest();
    this.dispatchEvent(goog.crypt.BlobHasher.EventType.COMPLETE);
  }
};


/**
 * Handle processing block loaded.
 * @private
 */
goog.crypt.BlobHasher.prototype.onLoad_ = function() {
  this.logger_.info('Successfully loaded a chunk');

  var array = null;
  if (this.fileReader_.result instanceof Array ||
      goog.isString(this.fileReader_.result)) {
    array = this.fileReader_.result;
  } else if (this.fileReader_.result instanceof ArrayBuffer) {
    array = new Uint8Array(this.fileReader_.result);
  }
  if (!array) {
    this.logger_.severe('Failed reading the chunk');
    this.dispatchEvent(goog.crypt.BlobHasher.EventType.ERROR);
    return;
  }
  this.hashFn_.update(array);
  this.bytesProcessed_ += array.length;
  this.dispatchEvent(goog.crypt.BlobHasher.EventType.PROGRESS);

  this.processNextBlock_();
};
