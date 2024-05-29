import { pingPanel, velocityX, velocityY } from "./engine.js";
import { loadLevel } from "./mapping.js";

export let socket;
export const pingInterval = 20;
export const playerUUID = crypto.randomUUID();
export let playerData;
export let shouldUpdateWithPredicted = false;
let pingStartTime = 0;
let ping1 = 0;
const PING_CHECK_THRESHOLD = 50;
const PING_UPDATE_INTERVAL = 50;
const LEVEL_DATA_TIMEOUT = 5000;

export function createGameWindowEvents() {
    window.onbeforeunload = function() {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.onclose = () => {};
            socket.send(JSON.stringify({ uuid: playerUUID, type: "disconnect" }));
            socket.close();
        }
    };
}

export function initWebSocket() {
    socket = new WebSocket("https://wwww-3ods.onrender.com");
    socket.onopen = () => {
        loadLevel();
        sendMoveData(velocityX, velocityY);
        getPlayerData();
        socket.onerror = function(event) {
            console.log(event)
            shouldUpdateWithPredicted = true;
        };
    };
    socket.onmessage = handleMessages;
}

export function getPlayerData() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'data', uuid: playerUUID }));
        pingStartTime = Date.now();
    }
}

export function sendMoveData(xvel, yvel) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "move", uuid: playerUUID, xvel, yvel }));
    }  
}

export async function getLevelData() {
    return await new Promise((resolve, reject) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
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

export function handleMessages(event) {
    const parsed = JSON.parse(event.data);
    if (parsed.type === "playerData") {
        playerData = parsed.players;
        ping1 = Date.now() - pingStartTime;
        getPlayerData();
    }
}

setInterval(() => {
    try  {
        pingPanel.update(ping1, ping1 < PING_CHECK_THRESHOLD ? PING_CHECK_THRESHOLD : 150);
    } catch(e) {
        // Handle potential errors
    }
}, PING_UPDATE_INTERVAL);
