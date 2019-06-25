'use strict';

const { TeamsHook } = require('./hooks/teams');
const express = require('express');
const path = require('path');
const { PServer } = require('./pserver');

const PORT = process.env.PORT || 3000;

function buildFile(url) {
    if(url === '/') {
        return path.join(__dirname, 'client/index.html');
    }
    else {
        return path.join(__dirname, url);
    }
}


// Define hooks
const teamsHook = new TeamsHook();

function serveResponse(req, res) {
    console.log(req.url);

    if(req.url.includes('/hook')) {
        teamsHook.handle(req, res);
    }
    else {
        res.sendFile(buildFile(req.url));
    }
}

const pServer = new PServer(express()
    .use(serveResponse)
    .listen(PORT, () => console.log(`Listening on ${ PORT }`)));

// Register hooks with the server
teamsHook.register(pServer);

setInterval(() => pServer.io.emit('time', new Date().toTimeString()), 1000);
