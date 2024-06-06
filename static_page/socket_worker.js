import { $BOOLBYTE } from "./boolbyte.js";
let socket;
const playerUUID = generate4ByteUUID();
let pingStartTime = 0;
let ping1 = 0;
const LEVEL_DATA_TIMEOUT = 5000;
var fullMoveBinarySend = new Uint8Array(5)
var keypress = []
var shouldPoll = false;

postMessage({ type: "uuid", uuid: playerUUID });

function initWebSocket(url) {
    try {
        try {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.onclose = () => { };
                socket.close();
            }
        } catch (e) { }

        socket = new WebSocket(url);

        socket.onerror = () => {
            console.log("error");
        };

        socket.onopen = () => {
            console.log("Opened websocket");
            getPlayerData();
            getLevelData()
        };

        socket.onmessage = handleMessages;
    } catch (e) {
        console.error("WebSocket initialization error:", e);
    }
}


function getPlayerData() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        var da = new Uint8Array(5);
        var asd = new $BOOLBYTE();

        asd.toggleToMatch(keypress);

        asd.set(0, true);
        asd.set(1, true);
        asd.set(2, true);
        asd.set(3, true);
        da[0] = asd.uint[0];
        for (let i = 0; i < playerUUID.length; i++) {
            da[i + 1] = playerUUID[i];
        }
        socket.send(da);
        pingStartTime = Date.now();
    }
}

function getLevelData() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        var da = new Uint8Array(5);
        var asd = new $BOOLBYTE();

        asd.toggleToMatch(keypress);

        asd.set(0, true);
        asd.set(1, true);
        asd.set(2, true);
        da[0] = asd.uint[0];
        for (let i = 0; i < playerUUID.length; i++) {
            da[i + 1] = playerUUID[i];
        }
        socket.send(da);
        pingStartTime = Date.now();
    }
}

function sendMoveData(moveBinary) {
    try {
        if (socket && socket.readyState === WebSocket.OPEN) {
            if (typeof moveBinary.keypresses === 'number' && moveBinary.keypresses >= 0 && moveBinary.keypresses <= 255) {
                fullMoveBinarySend[0] = moveBinary.keypresses;

                for (let i = 0; i < playerUUID.length; i++) {
                    fullMoveBinarySend[i + 1] = playerUUID[i];
                }

                socket.send(fullMoveBinarySend);
            } else {
                console.error("Invalid moveBinary.keypresses value");
            }
        }
    } catch (e) {
        console.error("Error sending move data:", e);
    }
}


var eventSheet = {
    15: handlePlayerData,
    7: handleLevelData
}

function handleLevelData(compressedData) {

    const numBitsPerRow = compressedData[1];
    
    compressedData = compressedData.slice(2); 

    const decompressedData = [];
    let row = [];

    for (const byte of compressedData) {
        const binaryString = byte.toString(2).padStart(8, '0'); 

        const bits = binaryString.split('').map(bit => parseInt(bit)); 

        row.push(...bits); 

        while (row.length >= numBitsPerRow) {
            decompressedData.push(row.slice(0, numBitsPerRow));
            row = row.slice(numBitsPerRow);
        }
    }

    self.postMessage({type: "level", level: decompressedData});
}





function handlePlayerData(data) {
    var players = { count: data[1], data: [], ping: ping1, type: "data" };
    var totalplayerdata = [];
    var uuid = data.slice(-4);

    var playerByteAmount = data[1] * 4;

    for (let i = 2, playerIndex = 0; i < 2 + playerByteAmount; i += 4, playerIndex++) {
        var x = (data[i] << 8) | data[i + 1];
        var y = (data[i + 2] << 8) | data[i + 3];

        totalplayerdata.push({ x: x, y: y, uuid: playerIndex === data[1] - 1 ? uuid : 0 });
    }

    players.data = totalplayerdata;
    self.postMessage(players)
}


function handleMessages(event) {
    const latin1String = event.data
    const latin1Array = new Uint8Array(latin1String.length);
    for (let i = 0; i < latin1String.length; i++) {
        latin1Array[i] = latin1String.charCodeAt(i);
    }
    var dataType = latin1Array[0]
    for (const [key, value] of Object.entries(eventSheet)) {
        if (dataType == key) {
            value(latin1Array)
        }
    }
}




self.addEventListener('message', (event) => {
    const data = event.data;

    if (data.type === "nS") {
        console.log("Switching to " + data.url);
        initWebSocket(data.url);
    } else if (data.type === "m") {
        sendMoveData(data.f);
    } else if (data.type === "d") {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.onclose = () => { };
            var disconnect = new Uint8Array(5);
            var asd = new $BOOLBYTE();
            asd.set(0, true);
            disconnect[0] = asd.uint[0];
            for (let i = 0; i < playerUUID.length; i++) {
                disconnect[i + 1] = playerUUID[i];
            }
            socket.send(disconnect);
            socket.close();
        }
    } else if (data.type === "k") {
        const newKeypress = new $BOOLBYTE();
        for (let i = 0; i < data.k.length; i++) {
            newKeypress.set(i, data.k[i] == "1" ? true : false);
        }
        keypress = newKeypress;
    } else if (data.type === "g") {
        shouldPoll = true;
    }
});

function generate4ByteUUID() {
    const hexValue = Math.floor(Math.random() * 0xFFFFFFFF).toString(16).padStart(8, '0');

    const binaryString = hexToBinary(hexValue);

    const uint8Array = binaryStringToUint8Array(binaryString);

    return uint8Array;
}

function hexToBinary(hexString) {
    const decimalValue = parseInt(hexString, 16);

    const binaryString = decimalValue.toString(2).padStart(32, '0');

    return binaryString;
}

function binaryStringToUint8Array(binaryString) {
    const uint8Array = new Uint8Array(4);

    for (let i = 0; i < 4; i++) {
        const byteString = binaryString.substring(i * 8, (i + 1) * 8);

        uint8Array[i] = parseInt(byteString, 2);
    }

    return uint8Array;
}

setInterval(() => {
    shouldPoll ? self.postMessage({ "type": "keypresses" }) : null;
    getPlayerData()
}, 1000 / 60)