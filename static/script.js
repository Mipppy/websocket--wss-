import { initCanvas } from "./render.js";
import { createWindowEvents } from "./windowevents.js";
import { gameLoop, loadFPS } from "./engine.js"
import { startErUp } from "./worker_handler.js";

export function startGame() {
    loadFPS()
    initCanvas();
    createWindowEvents();
    startErUp();
    requestAnimationFrame(gameLoop);
}
