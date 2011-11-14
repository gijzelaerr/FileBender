importScripts('BlobBuilder.js');
importScripts('sjcl.js');


var plainBlob = null;
var cryptBlob = null;
var builder = new self.BlobBuilder();
var key = null;
var plainChunk = null;
var cryptChunk = null;
var reader = new self.FileReader;


reader.onerror = function(e) {
    postMessage({'status': 'error', 'message':e});
};


reader.onload = function(FREvent) {
    plainChunk = FREvent.target.result;
    doCrypt();
};


function doCrypt() {
    cryptChunk = sjcl.encrypt(key, plainChunk);
    builder.append(cryptChunk);
    cryptBlob = uploader.builder.getBlob();
    done();
}


function onmessage(e) {
    plainBlob = e.data['data'];
    key = e.data['key']
    reader.readAsDataURL(plainBlob);
};


function done() {
    postMessage({'status': 'ok', 'data':cryptBlob});
}