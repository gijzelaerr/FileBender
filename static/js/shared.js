

// attempt to make this generic
//Blob.prototype.slice = Blob.prototype.mozSlice || Blob.prototype.webkitSlice || Blob.prototype.slice;
//File.prototype.slice = File.prototype.mozSlice || File.prototype.webkitSlice || File.prototype.slice;

/**
 * Settings
 */
var chunkSize = 5 * 1024 * 1024;


/**
 * calculates base64 length given input length
 */
var base64Len = function(input_length) {
    if (self.MozBlobBuilder) {
        //firefox format: data:application/octet-stream;base64,ALJfWO5zyqcM8ryQXX+Fl+Hny9o=
        return 37 + Math.round((input_length+1)/3.0) * 4;
    }

    if (self.WebKitBlobBuilder) {
        //chrome format: data:base64,ALJfWO5zyqcM8ryQXX+Fl+Hny9o=
        return 12 + Math.round((input_length+1)/3.0) * 4;
    }
}


/**
 * calculates crypted length given input length
 */
var cryptLen = function(input_length) {
    return 66 + Math.ceil((input_length - 1) * 4/3);
}


/**
 * Helper function to format file size
 */
var formatSize = function(size) {
    if(size > 1024 * 1024 * 1024)
        return (Math.round(size * 100 / (1024 * 1024 * 1024)) / 100).toString() + 'GB';
    else if(size > 1024 * 1024)
        return (Math.round(size * 100 / (1024 * 1024)) / 100).toString() + 'MB';
    else
        return (Math.round(size * 100 / 1024) / 100).toString() + 'KB';
}
