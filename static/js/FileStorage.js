

self.BlobBuilder = self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder;
window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;


function fileErrorHandler(e) {
    var msg = '';

    switch (e.code) {
        case FileError.QUOTA_EXCEEDED_ERR:
            msg = 'QUOTA_EXCEEDED_ERR';
            break;
        case FileError.NOT_FOUND_ERR:
            msg = 'NOT_FOUND_ERR';
            break;
        case FileError.SECURITY_ERR:
            msg = 'SECURITY_ERR';
            break;
        case FileError.INVALID_MODIFICATION_ERR:
            msg = 'INVALID_MODIFICATION_ERR';
            break;
        case FileError.INVALID_STATE_ERR:
            msg = 'INVALID_STATE_ERR';
            break;
        default:
            msg = 'Unknown Error';
            break;
    };

    console.log('Error: ' + msg);
};


function FileStorage() {
    this.writer = null;
    this.fileEntry = null;
    this.useFileSystemApi = false;
    this.blobBuilder = null;
    this.completed = 0;
};


FileStorage.prototype.start = function(fileName, size) {
    this.fileName = fileName;
    this.size = size;

    if (window.requestFileSystem) {
        this.useFileSystemApi = true;
        this._initFsApi();
    } else {
        this.blobBuilder = new BlobBuilder();
    };
};


FileStorage.prototype._initFsApi = function() {
    var that = this;
    window.webkitStorageInfo.requestQuota(window.TEMPORARY, this.size, function(granted) {
        window.requestFileSystem(window.TEMPORARY, granted, function(fs) {
            // bad hack to remove file if it exists
            fs.root.getFile(that.fileName, {create: true, exclusive: false}, function(fileEntry) {
                    fileEntry.remove(function() {
                        console.log('File removed.');
                    }, fileErrorHandler);
                }, fileErrorHandler);
            fs.root.getFile(that.fileName, {create: true, exclusive: false}, function(fileEntry) {
                that.fileEntry = fileEntry;
                fileEntry.createWriter(function(fileWriter) {
                    that.writer = fileWriter;
                    that.onload();
                }, fileErrorHandler);
            }, fileErrorHandler);
        }, fileErrorHandler);
    }, fileErrorHandler);
};


FileStorage.prototype.append = function(data) {
    if (this.useFileSystemApi) {
        this._appendFsApi(data);
    } else {
        this.blobBuilder.append(data);
    };
};


 FileStorage.prototype._appendFsApi = function(data) {
    var blobBuilder = new BlobBuilder();
    blobBuilder.append(data);
    var b = blobBuilder.getBlob();
    this.writer.seek(this.completed);
    this.writer.write(b);
    this.completed = this.completed + b.size;
 };


FileStorage.prototype.getUrl = function() {
    if (this.useFileSystemApi) {
        return this.fileEntry.toURL();
    } else {
        return this.blobBuilder.getBlob().toURL();
    };
};


/** callback called when file is ready for writing
 *
 */
FileStorage.prototype.onload = function() {

};
