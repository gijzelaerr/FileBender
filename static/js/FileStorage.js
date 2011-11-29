

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


function FileStorage(fileName, size) {

    this.fs = null;
    this.fileName = fileName;
    this.size = size;
    this.writer = null;
    this.fileEntry = null;

    window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;

    var that = this;

    window.webkitStorageInfo.requestQuota(window.TEMPORARY, size, function(granted) {
        console.log("we have quota");
        window.requestFileSystem(window.TEMPORARY, granted, function(fs) {
            console.log("we have filesystem");
            fs.root.getFile(that.fileName, {create: false, exclusive: false}, function(fileEntry) {
                    console.log("we have file");
                    that.fileEntry = fileEntry;
                    fileEntry.createWriter(function(fileWriter) {
                        console.log("we have fileEntry");
                        that.writer = fileWriter;
                        that.onload();
                    });
                }, fileErrorHandler);
        }, fileErrorHandler);
    }, fileErrorHandler);
};


 FileStorage.prototype.append = function(blob) {
    if (!this.writer) {
        console.log("fileStorage not initialised correctly");
        return;
    };

    if (this.writer.length > 0) {
        this.writer.seek(this.fileWriter.length);
        this.writer.write(blob);
    };
};


FileStorage.prototype.getUrl = function() {
    if (!this.fileEntry) {
        console.log("fileStorage not initialised correctly");
        return;
    };

    return this.fileEntry.toURL();
};


/** callback called when file is ready for writing
 *
 */
FileStorage.prototype.onload = function() {

};
