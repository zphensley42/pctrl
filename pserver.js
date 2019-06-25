'use strict';
const socketIO = require('socket.io');
const EventEmitter = require( 'events' );

class PServer extends EventEmitter {
    constructor(server) {
        super();
        this.io = socketIO(server);
        this.pclient = null;

        this.setupEvents();
    }

    setupEvents() {
        let boundOnConnected = this.onConnected;
        boundOnConnected = boundOnConnected.bind(this);
        this.io.on('connection', boundOnConnected);

        this.on('command', function (command) {
            console.log(`Command received: ${JSON.stringify(command)}`);

            if(this.pclient != null) {
                let cmd = command.cmd;
                let slot1 = command.slots[0].value;
                let slot2 = command.slots[1].value;
                let slot3 = command.slots[2].value;

                console.log('Emitting command to pclient');
                this.pclient.emit('message', {
                    cmd : {
                        intent: {
                            'intentName': `zphensley42:${cmd}`
                        },
                        slots: [
                            {
                                value: {
                                    value: `${slot1.value}`
                                }
                            },
                            {
                                value: {
                                    value: `${slot2.value}`
                                }
                            },
                            {
                                value: {
                                    value: `${slot3.value}`
                                }
                            }
                        ]
                    }
                });
            }
        });
    }

    onConnected(socket) {
        console.log('Client connected');
        let boundOnDisconnected = this.onDisconnected;
        boundOnDisconnected = boundOnDisconnected.bind(this);
        socket.on('disconnect', boundOnDisconnected);

        let boundOnMessage = this.onMessage;
        boundOnMessage = boundOnMessage.bind(this);
        socket.on('message', (msg) => {
            boundOnMessage(socket, msg);
        });

        // Ask the client who they are
        socket.emit('message', {'query': 'id'});
    }

    onDisconnected() {
        console.log('Client disconnected');
    }

    onMessage(socket, msg) {
        console.log('onMessage', msg);
        if(msg.hasOwnProperty('id')) {
            if(msg.id === 'pclient') {
                this.pclient = socket;
                console.log('pclient detected');
            }
        }
        else if(msg.hasOwnProperty('cmd')) {
            if(this.pclient != null) {
                this.pclient.emit('message', msg);
            }
            else {
                console.error('pclient is not connected!');
            }
        }
    }
}

module.exports = {
    PServer : PServer
};
