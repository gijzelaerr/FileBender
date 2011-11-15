importScripts('sjcl.js');

var key = null;
var plainChunk = null;
var cryptChunk = null;


self.onmessage = function(event) {
    debug("message received");
    plainChunk = event.data['data'];
    key = event.data['key'];
    doCrypt();
};


function doCrypt() {
    debug("starting encryption");
    try {
        cryptChunk = sjcl.encrypt(key, plainChunk);
    } catch(e) {
        error("can't crypt: " + e.toString());
        return;
    };
    done();
};

function done() {
    debug("encryption finished");
    postMessage({'status': 'ok', 'data':cryptChunk});
}


function error(e) {
    postMessage({'status': 'error', 'message':e});
};

function debug(e) {
    postMessage({'status': 'debug', 'message':e});
};