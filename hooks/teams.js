'use strict';

const crypto = require('crypto');

class TeamsHook {
    constructor() {
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

        this.sharedSecret = process.env.TEAMS_SEC;
        this.bufSecret = Buffer(this.sharedSecret, "base64");

        this.cmdRegex = /.*Peeqo.*[;\s+](.*)\n/;
    }

    register(pServer) {
        this.pServer = pServer;
    }

    validCommand(cmd) {
        if(cmd == null) {
            return false;
        }
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

    handle(request, response) {

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
                    let m = receivedMsg.text.match(this.cmdRegex);
                    let receivedCommand = m != null && m.length >= 2 ? m[1] : null;

                    if(validCommandFunc(receivedCommand)) {
                        console.log(`command found: ${receivedCommand}`);
                        responseJson = {
                            text: "Command found",
                            command: `${receivedCommand}`
                        };

                        if(this.pServer != null) {
                            console.log('Emitting command to pServer');
                            let vals = receivedCommand.split(',');
                            this.pServer.emit('command', {
                                cmd: {
                                    intent: {
                                        intentName: `${vals[0]}`
                                    },
                                    slots: [
                                        {
                                            value: {
                                                value: `${vals.length >= 2 ? vals[1] : ''}`
                                            }
                                        },
                                        {
                                            value: {
                                                value: `${vals.length >= 3 ? vals[2] : ''}`
                                            }
                                        },
                                        {
                                            value: {
                                                value: `${vals.length >= 4 ? vals[3] : ''}`
                                            }
                                        }
                                    ]
                                }
                            });
                        }
                    }
                    else {
                        responseJson = {
                            text: "Command not found"
                        };
                    }
                }
                response.writeHead(200);
                response.write(JSON.stringify(responseJson));
                response.end();
            }
            catch (err) {
                response.writeHead(400);
                return response.end("Error: " + err + "\n" + err.stack);
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