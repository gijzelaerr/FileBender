/** This file should be run inside a WebWorker. It will encrypt a message in the background.
 *
 */

importScripts('sjcl.js');


var key = null;
var plainChunk = null;
var cryptChunk = null;


/** Input from my master
 *
 */
self.onmessage = function(event) {
    debug("message received");
    plainChunk = event.data['data'] || null;
    key = event.data['key'] || null;

    if (typeof(plainChunk) != "string" || (plainChunk.length = 0)) {
        error("empty data received");
        return;
    };

    if (typeof(key) != "string" || (key.length = 0)) {
        error("empty key received");
        return;
    };

    doCrypt();
};


/** Start encryption
 *
 */
function doCrypt() {
    try {
        debug("starting encryption");
        cryptChunk = sjcl.encrypt(key, plainChunk);
        debug("encryption finished");
    } catch(e) {
        error("can't crypt: " + e.toString());
        return;
    };
    done();
};


/** Called when encryption is finished
 *
 */
function done() {
    debug("returning data");
    postMessage({'status': 'ok', 'data':cryptChunk});
    debug("data was returned");
}


function error(e) {
    postMessage({'status': 'error', 'message':e});
};

function debug(e) {
    postMessage({'status': 'debug', 'message':e});
};