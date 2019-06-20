'use strict';

let socket = io();
let el = document.getElementById('server-time');
socket.on('time', function(timeString) {
    el.innerHTML = 'Server time: ' + timeString;
});

let intentBtn = document.getElementById('testIntentBtn');
console.log(intentBtn);
intentBtn.onclick = () => {
    socket.emit('message', {'cmd': 'KittyTime'});
};