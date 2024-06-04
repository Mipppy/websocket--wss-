
let socket;
const pingInterval = 20;
const playerUUID = crypto.randomUUID().replace("-", "").slice(0, -25);
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
        socket.send(JSON.stringify({ type: 'd', uuid: playerUUID }));
        pingStartTime = Date.now();
    }
}

function sendMoveData() {
    try {
        if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: "m", uuid: playerUUID, "0" : keypresses.w ? keypresses.w : false, "1" : keypresses.a ? keypresses.a : false, "2": keypresses.s ? keypresses.s : false, "3":keypresses.d ? keypresses.d : false }));
            
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

    if (parsed.type === "p") {
        ping1 = Date.now() - pingStartTime;
        postMessage({ type: 'data', data: parsed.p, ping: ping1 });
        getPlayerData()

    } else if (parsed.type === "c") {
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
        sendMoveData(data.f);
    } else if (data.type === "d") {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.onclose = () => { };
            socket.send(JSON.stringify({ uuid: playerUUID, type: "disconnect" }));
            socket.close();
        }
    }
});