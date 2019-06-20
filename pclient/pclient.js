'use strict';

// This "client" is the Peeqo app itself
// Commands are passed to it from the server after it connects, these are usually forwarded from other real clients to the server

console.log('pclient started');

const id = 'pclient';

class PClient {

    constructor() {
        this.socket = io();

        this.setupEvents();
    }

    setupEvents() {
        let boundOnConnected = this.onConnected;
        boundOnConnected = boundOnConnected.bind(this);
        this.socket.on('connect', boundOnConnected);
    }

    onConnected() {
        if(this.socket.connected) {
            let boundOnMessageReceived = this.onMessageReceived;
            boundOnMessageReceived = boundOnMessageReceived.bind(this);
            this.socket.on('message', boundOnMessageReceived);
        }
    }

    notifyPClientConnect() {
        this.socket.emit('message', {'id': `${id}`});
    }

    onMessageReceived(msg) {
        console.log('onMessageReceived ', msg);

        if(msg.hasOwnProperty('query')) {
            if(msg.query === 'id') {
                this.notifyPClientConnect();
            }
        }
    }
}

const pClient = new PClient();
