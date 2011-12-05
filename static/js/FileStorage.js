

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
    this.fileWriter = null;
    this.fileEntry = null;
    this.fs = null;
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
            that.fs = fs;
            fs.root.getFile(that.fileName, {create: false, exclusive: false}, function(fileEntry) {
                console.log("removing old file");
                fileEntry.remove(that._makeFileWriter, fileErrorHandler);
                }, function() {
                    console.log("file doesn't exists yet, don't remove");
                    that._makeFileWriter();
                }
            );
        }, fileErrorHandler);
    }, fileErrorHandler);
};


FileStorage.prototype._makeFileWriter = function() {
    var that = this;
    try {
        this.fs.root.getFile(this.fileName, {create: true, exclusive: false}, function(fileEntry) {
            that.fileEntry = fileEntry;
            fileEntry.createWriter(function(fileWriter) {
                fileWriter.onwriteend = function(trunc) {
                    that.onload();
                };
                that.writer = fileWriter;
            }, fileErrorHandler);
        }, fileErrorHandler);
    } catch(e) {
      console.log("wtf");
    };

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
    this.fileWriter.write(b);
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
