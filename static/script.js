import { getPlayerData, initWebSocket, sendMoveData } from "./gamesocket.js"
import { initCanvas } from "./render.js";
import { createWindowEvents } from "./windowevents.js";
import { gameLoop, loadFPS, velocityX, velocityY } from "./engine.js"
import { loadLevel } from "./mapping.js";

export function startGame() {
    loadLevel();
    sendMoveData(velocityX, velocityY);
    getPlayerData();
    initCanvas();
    createWindowEvents();
    loadFPS()
    requestAnimationFrame(gameLoop);
}


export function handlePlayerCount(count) {
    try {
        document.getElementById("playerCount").innerText = count
    } catch (e) { }
}