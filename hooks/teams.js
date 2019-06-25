'use strict';

const crypto = require('crypto');
const botName = 'Peeqo';

class TeamsHook {
    constructor(res) {
        this.response = res;

        // this.sharedSecret = process.env.TEAMS_SEC;
        // this.bufSecret = Buffer(this.sharedSecret, "base64");
        this.commands = [
            'Greeting',
            'Camera',
            'Timer',
            'Weather',
            'ChangeGlasses',
            'Goodbye',
            'KittyTime',
            'HueGroup',
            'HueLight',
            'Patrick',
            'GitHub'
        ];
    }

    validCommand(cmd) {
        return this.commands.indexOf(cmd) !== -1;
    }

    validateAuth(payload, request) {
        // Retrieve authorization HMAC information
        let auth = request.headers['authorization'];

        // Calculate HMAC on the message we've received using the shared secret
        let msgBuf = Buffer.from(payload, 'utf8');
        let msgHash = "HMAC " + crypto.createHmac('sha256', this.bufSecret).update(msgBuf).digest("base64");

        return msgHash === auth;
    }

    handle(request) {
        let payload = '';

        let onDataFunc = function (data) {
            payload += data;
        };
        onDataFunc = onDataFunc.bind(this);

        let validateAuthFunc = this.validateAuth;
        validateAuthFunc = validateAuthFunc.bind(this);

        let validCommandFunc = this.validCommand;
        validCommandFunc = validCommandFunc.bind(this);

        let onEndFunc = function() {
            try {
                let validAuth = validateAuthFunc(payload, request);

                let responseJson = {
                    text: "Error: message sender cannot be authenticated."
                };
                if (validAuth) {
                    let receivedMsg = JSON.parse(payload);
                    console.log(receivedMsg);

                    // Determine what command to send
                    let receivedCommand = receivedMsg.text.replace(botName + ' ', '');
                    if(validCommandFunc(receivedCommand)) {
                        responseJson = {
                            text: "Command found",
                            command: `${receivedCommand}`
                        };
                    }
                    else {
                        responseJson = {
                            text: "Command not found"
                        };
                    }
                }
                this.response.writeHead(200);
                this.response.write(JSON.stringify(responseJson));
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