'use strict';

let socket = io();
let el = document.getElementById('server-time');
let intentSelect = document.getElementById('intent-select');
let intentBtn = document.getElementById('testIntentBtn');
let slots = document.getElementById('slots-div');
let slot1 = document.getElementById('slot1');
let slot2 = document.getElementById('slot2');
let slot3 = document.getElementById('slot3');

socket.on('time', function(timeString) {
    el.innerHTML = 'Server time: ' + timeString;
});

let noSlots = [ 'ChangeGlasses', 'Goodbye', 'KittyTime', 'Patrick', 'Greeting' ];
intentSelect.oninput = () => {
    let exists = noSlots.indexOf(intentSelect.value) !== -1;
    if(exists) {
        slots.style.display = 'none';
    }
    else {
        slots.style.display = "block";
    }
};

console.log(intentBtn);
intentBtn.onclick = () => {

    let cmd = intentSelect.value;

    if(cmd === "Timer") {
        socket.emit('message', {
            cmd : {
                intent: {
                    'intentName': `zphensley42:${cmd}`
                },
                slots: [
                    {
                        value: {
                            hours: `${slot1.value}`,
                            minutes: `${slot2.value}`,
                            seconds: `${slot3.value}`
                        }
                    }
                ]
            }
        });
    }
    else {
        socket.emit('message', {
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
};


let exists = noSlots.indexOf(intentSelect.value) !== -1;
if(exists) {
    slots.style.display = 'none';
}
else {
    slots.style.display = "block";
}
