import * as renderer from "./render.js"
import {x, y} from "./engine.js"
export var socket;
export var pingInterval = 20
export var playerUUID = crypto.randomUUID();
export var playerData;

export function createGameWindowEvents() {
    window.onbeforeunload = function() {
        socket.onclose = function () {};
        socket.send(JSON.stringify({uuid: playerUUID, type: "disconnect"}));
        socket.close();
    };
}

export function initWebSocket() {
    socket = new WebSocket("http://localhost:8000")
    socket.onopen = () => {
        ping();
        getPlayerData();
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
    sendPlayerData();
    if (socket.readyState == socket.OPEN) {
        socket.send(JSON.stringify({type: 'data'}))
    }
}

export function sendPlayerData() {
    if (socket.readyState == socket.OPEN) {
        socket.send(JSON.stringify({uuid : playerUUID, type: 'coord', x: x, y:y}))
    }
}

export function handleMessages(message) {
    var parsed = JSON.parse(message);
    if (parsed.type == "__pong__") {
        console.log("Pinged and Ponged")
    }
    if (parsed.type == "playerData") {
        playerData = parsed.players;
        try {
            renderer.renderPlayers(playerData);

        } catch(Error) {
            null;
        }
        getPlayerData();
    }
}

