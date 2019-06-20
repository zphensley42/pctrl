'use strict';
const socketIO = require('socket.io');

class PServer {
    constructor(server) {
        this.io = socketIO(server);
        this.pclient = null;

        this.setupEvents();
    }

    setupEvents() {
        let boundOnConnected = this.onConnected;
        boundOnConnected = boundOnConnected.bind(this);
        this.io.on('connection', boundOnConnected);
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
