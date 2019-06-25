'use strict';

const crypto = require('crypto');

class TeamsHook {
    constructor(res) {
        this.response = res;

        this.sharedSecret = process.env.TEAMS_SEC;
        this.bufSecret = Buffer(this.sharedSecret, "base64");
    }

    handle(request) {
        let payload = '';

        let onDataFunc = function (data) {
            payload += data;
        };
        onDataFunc = onDataFunc.bind(this);

        let onEndFunc = function() {
            try {
                // Retrieve authorization HMAC information
                var auth = request.headers['authorization'];
                // Calculate HMAC on the message we've received using the shared secret
                var msgBuf = Buffer.from(payload, 'utf8');
                var msgHash = "HMAC " + crypto.createHmac('sha256', this.bufSecret).update(msgBuf).digest("base64");

                if (msgHash === auth) {
                    var receivedMsg = JSON.parse(payload);
                    var responseMsg = '{ "type": "message", "text": "You typed: ' + receivedMsg.text +  ', have a gif: https://media.giphy.com/media/xU9TT471DTGJq/giphy.gif" }';
                } else {
                    var responseMsg = '{ "type": "message", "text": "Error: message sender cannot be authenticated." }';
                }
                this.response.writeHead(200);
                this.response.write(responseMsg);
                this.response.end();
            }
            catch (err) {
                this.response.writeHead(400);
                return this.response.end("Error: " + err + "\n" + err.stack);
            }
        };
        onEndFunc = onEndFunc.bind(this);

        // Process the request
        request.on('data', onDataFunc);

        // Respond to the request
        request.on('end', onEndFunc);
    }
}

module.exports = {
    TeamsHook: TeamsHook
};