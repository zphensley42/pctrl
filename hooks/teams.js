'use strict';

const crypto = require('crypto');
const DBG_MODE=true;

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
            'GitHub',
            'TableFlip'
        ];

        if(!DBG_MODE) {
            this.sharedSecret = process.env.TEAMS_SEC;
            this.bufSecret = Buffer(this.sharedSecret, "base64");
        }

        this.cmdRegex1 = /(?:[^\s"]+|"[^"]*")+/g;
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
        if(DBG_MODE) {
            return true;
        }
        // Retrieve authorization HMAC information
        let auth = request.headers['authorization'];

        // Calculate HMAC on the message we've received using the shared secret
        let msgBuf = Buffer.from(payload, 'utf8');
        let msgHash = "HMAC " + crypto.createHmac('sha256', this.bufSecret).update(msgBuf).digest("base64");

        return msgHash === auth;
    }

    startOfCommand(commandText) {
        let retVal = "";
        this.commands.forEach((val, index, arr)=>{
            if(retVal === "") {
                let start = commandText.indexOf(val);
                if(start !== -1) {
                    retVal = commandText.substr(start, commandText.length - start);
                }
            }
        });

        return retVal;
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

                    // First, get the start of our command
                    let commandStart = this.startOfCommand(receivedMsg.text);

                    // Determine what command to send
                    let match = commandStart.match(this.cmdRegex1);
                    let command = match.length >= 1 ? match[0] : '';
                    let slot1 = match.length >= 2 ? match[1] : '';
                    let slot2 = match.length >= 3 ? match[2] : '';
                    let slot3 = match.length >= 4 ? match[3] : '';
                    slot1 = slot1.replace(/"/g, '');
                    slot2 = slot2.replace(/"/g, '');
                    slot3 = slot3.replace(/"/g, '');

                    console.log(`command: ${command}, slot1: ${slot1}, slot2: ${slot2}, slot3: ${slot3}`);

                    if(command === 'help') {
                        responseJson = {
                            text: `Commands: ${this.commands.join('\n')}`,
                        };
                    }
                    else if(validCommandFunc(command)) {
                        // TODO: Treat each command's response individually via some class method
                        if(command === 'TableFlip') {
                            responseJson = {
                                text: '(╯°□°)╯︵ ┻━┻'
                            };
                        }
                        else {
                            responseJson = {
                                text: `Command found: ${command}, slot1: ${slot1}, slot2: ${slot2}, slot3: ${slot3}`,
                                command: `${command}`
                            };
                        }

                        if(this.pServer != null) {
                            console.log('Emitting command to pServer');
                            this.pServer.emit('command', {
                                cmd: {
                                    intent: {
                                        intentName: `${command}`
                                    },
                                    slots: [
                                        {
                                            value: {
                                                value: `${slot1}`
                                            }
                                        },
                                        {
                                            value: {
                                                value: `${slot2}`
                                            }
                                        },
                                        {
                                            value: {
                                                value: `${slot3}`
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