import { pingPanel } from "./engine.js";
import { loadLevel } from "./mapping.js";
export var socket;
export var pingInterval = 20
export var playerUUID = crypto.randomUUID();
export var playerData;
export var currentlyUpdated
let pingStartTime = 0;
let ping1 = 0;
let pingsPerSecond = [];
let highestPing = 0;

export function createGameWindowEvents() {
    window.onbeforeunload = function() {
        socket.onclose = function () {};
        socket.send(JSON.stringify({uuid: playerUUID, type: "disconnect"}));
        socket.close();
    };
}

export function initWebSocket() {
    socket = new WebSocket("wss://websocket-wss.onrender.com")
    socket.onopen = () => {
        ping();
        getPlayerData();
        loadLevel();
    }
    
    socket.onmessage = (event) => {
        handleMessages(event.data);
    }
}

export function ping() {
    setInterval(() => {
        if (socket.readyState == socket.OPEN) {
            socket.send(JSON.stringify({uuid: playerUUID, type: "__ping__"}));
        }
    }, pingInterval * 100);
}

export function getPlayerData() {
    if (socket.readyState == socket.OPEN) {
        pingStartTime = Date.now();
        socket.send(JSON.stringify({type: 'data', uuid: playerUUID}))
    }
}

export function sendMoveData(xvel, yvel) {
    if (socket.readyState == socket.OPEN) {
        socket.send(JSON.stringify({type: "move", uuid: playerUUID, xvel: xvel, yvel: yvel}))
    }  
}

export function sendXYData(x,y) {
    if (socket.readyState == socket.OPEN) {
        socket.send(JSON.stringify({type: "xy", uuid: playerUUID, x:x, y:y}))
    }
}

export async function getLevelData() {
    return await new Promise((resolve, reject) => {
        if (socket.readyState == socket.OPEN) {
            socket.send(JSON.stringify({ type: "getLevel" }));
        } else {
            reject(new Error("Socket is not open"));
        }

        function onMessage(event) {
            var parsed = JSON.parse(event.data);
            if (parsed.type == "levelData") {
                socket.removeEventListener("message", onMessage);
                resolve(parsed.level);
            }
        }

        socket.addEventListener("message", onMessage);
        setTimeout(() => {
            socket.removeEventListener("message", onMessage); 
            reject(new Error("Timeout waiting for level data"));
        }, 5000);
    });
}

function calculatePing() {
    ping1 = Date.now() - pingStartTime;
    pingsPerSecond.push(ping1);

    if (pingsPerSecond.length > 60) {
        pingsPerSecond.shift();
    }
    
    if (ping1 > highestPing) {
        highestPing = ping1;
    }
}


export function handleMessages(message) {
    var parsed = JSON.parse(message);
    if (parsed.type == "__pong__") {
    }
    if (parsed.type == "playerData") {
        playerData = parsed.players;
        calculatePing()
        getPlayerData();
    }
}

setInterval(() => {
    try  {
        pingPanel.update(ping1, highestPing);
    } catch(e) {}
}, .1)