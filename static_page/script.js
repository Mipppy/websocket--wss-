import { initCanvas } from "./render.js";
import { createWindowEvents } from "./windowevents.js";
import { gameLoop, loadFPS } from "./engine.js"
import { sendMoveData } from "./worker_handler.js";

export function startGame() {
    sendMoveData(0,0)
    initCanvas();
    createWindowEvents();
    loadFPS()
    requestAnimationFrame(gameLoop);
}
