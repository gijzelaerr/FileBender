

window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
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
    this.fileWriter = null;
    this.fileEntry = null;
    this.useFileSystemApi = false;
    this.blobBuilder = null;
};


FileStorage.prototype.start = function(fileName, size) {
    this.fileName = fileName;
    this.size = size;

    if (window.requestFileSystem) {
        this.useFileSystemApi = true;
        this._initFsApi();
    } else {
        this.useFileSystemApi = false;
        this.blobBuilder = new BlobBuilder();
        this.ready();
    };
};


FileStorage.prototype._initFsApi = function() {
    var that = this;

    function fsGranted(fs) {
        fs.root.getFile(that.fileName, {create: true, exclusive: false}, function(fileEntry) {
            console.log("file created, creating writer");
            that.fileEntry = fileEntry;
            fileEntry.createWriter(function(fileWriter) {
                console.log("writer created");

                fileWriter.onwriteend = function(trunc) {
                    console.log("file writing finished");
                    that.ready();
                };

                fileWriter.onerror = fileErrorHandler;

                if (fileWriter.length > 0) {
                    console.log("file truncated");
                    fileWriter.truncate(0);
                };

                that.fileWriter = fileWriter;
                that.ready();
            });

        });
    };


    function quotaGranted(quota) {
        window.requestFileSystem(window.TEMPORARY, quota, fsGranted, fileErrorHandler);
    };

    window.webkitStorageInfo.requestQuota(window.TEMPORARY, this.size, quotaGranted, fileErrorHandler);
};




FileStorage.prototype.finalize = function() {
    this.fileEntry.remove(function () {console.log("file removed")}, function () {console.log("can't remove file")});
}



FileStorage.prototype.append = function(data) {
    if (this.useFileSystemApi) {
        this.blobBuilder = new BlobBuilder();
        this.blobBuilder.append(data);
        this.fileWriter.write(this.blobBuilder.getBlob());
    } else {
        this.blobBuilder.append(data);
        this.ready();
    };
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
FileStorage.prototype.ready = function() {
    console.log("writer ready");
};
