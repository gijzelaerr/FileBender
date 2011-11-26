
function BlobSlicer() {
    this.logger = console.log;
    this.blobSlice = null;
    this.blob = null;
    this.chunkSize = 5 * 1024 * 1024; // 5 MB default
    this.builder = null;
    this.complete = 0;


    /** Read a file and slice it
     * @param {Blob} blob or file to be slice
     * @param {int} chunkSize the size of the chunks in bytes
     */
    this.read = function(blob, chunkSize) {
        this.blob = blob;
        this.chunkSize = chunkSize || this.chunkSize;
        this.completed = 0;
        this._nextSlice();
    };


    /** make next blob slice
     * @private
     */
    this._nextSlice = function() {
        var start = this.completed;
        var end = Math.min(this.completed + this.chunkSize, this.file.size);

        if (end == this.chunkSize || this.chunkSize == 0) {
            this.blobSlice = this.file;
        } else {
            // making the slice generic between different browser vendors
            this.file.slice = this.file.mozSlice || this.file.webkitSlice || this.file.slice;
            this.blobSlice = uploader.file.slice(start, end);
        };

        // notify that the slice is ready
        this.onslice();

        this.completed = Math.min(this.file.size, this.completed + this.chunkSize);

        if(this.completed < this.file.size) {
            this._nextChunk();
        } else {
            this.onfinish();
        };
    };
};





/**Called when slicing the data is completed
 *
 */
BlobSlicer.prototype.onfinish = function() {};


/** Called when a chunk is encrypted and ready for whatever you want to do with it
 */
BlobSlicer.prototype.onslice = function() {};


