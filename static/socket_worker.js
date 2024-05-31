let socket;
const pingInterval = 20;
const playerUUID = crypto.randomUUID();
let playerData = [];
let shouldUpdateWithPredicted = false;
let pingStartTime = 0;
let ping1 = 0;
const PING_CHECK_THRESHOLD = 50;
const PING_UPDATE_INTERVAL = 50;
const LEVEL_DATA_TIMEOUT = 5000;

postMessage({ type: "uuid", uuid: playerUUID });

function initWebSocket(url) {
    try {
        try {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.onclose = () => { };
                socket.close();
            }    
        } catch (e) {}

        socket = new WebSocket(url);
        
        socket.onerror = () => {
            console.log("error");
        };

        socket.onopen = () => {
            console.log("Opened websocket");
            getPlayerData();
            getLevelData().then((level) => { postMessage({ type: "level", level: level }); });
        };

        socket.onmessage = handleMessages;
    } catch (e) {
        console.error("WebSocket initialization error:", e);
    }
}

function getPlayerData() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        shouldUpdateWithPredicted = false;
        socket.send(JSON.stringify({ type: 'data', uuid: playerUUID }));
        pingStartTime = Date.now();
    }
}

function sendMoveData(xvel, yvel) {
    try {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "move", uuid: playerUUID, xvel : (xvel ? xvel : 0) , yvel: (yvel ? yvel : 0) }));
        }
    } catch (e) {}
}

async function getLevelData() {
    return await new Promise((resolve, reject) => {
        if (socket && socket.readyState === socket.OPEN) {
            socket.send(JSON.stringify({ type: "getLevel" }));
            const onMessage = event => {
                const parsed = JSON.parse(event.data);
                if (parsed.type === "levelData") {
                    socket.removeEventListener("message", onMessage);
                    resolve(parsed.level);
                }
            };
            socket.addEventListener("message", onMessage);
            setTimeout(() => {
                socket.removeEventListener("message", onMessage);
                reject(new Error("Timeout waiting for level data"));
            }, LEVEL_DATA_TIMEOUT);
        } else {
            reject(new Error("Socket is not open"));
        }
    });
}

function handleMessages(event) {
    const parsed = JSON.parse(event.data);
    getPlayerData()

    if (parsed.type === "playerData") {
        playerData = parsed.players;
        ping1 = Date.now() - pingStartTime;
        postMessage({ type: 'data', data: parsed.players, ping: ping1 });

    } else if (parsed.type === "playerCount") {
        postMessage({ type: "playerCount", count: parsed.count });
    }
}

setInterval(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "playerCount" }));
    }
}, 1000);

self.addEventListener('message', (event) => {
    const data = event.data;
    
    if (data.type === "nS") {
        console.log("Switching to " + data.url);
        initWebSocket(data.url);
    } else if (data.type === "m") {
        sendMoveData(data.x, data.y);
    } else if (data.type === "d") {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.onclose = () => { };
            socket.send(JSON.stringify({ uuid: playerUUID, type: "disconnect" }));
            socket.close();
        }
    }
});