import { initWebSocket } from "./gamesocket.js"
import { initCanvas } from "./render.js";
import { createWindowEvents } from "./windowevents.js";
import {gameLoop, loadFPS} from "./engine.js"
initCanvas(document);
initWebSocket();
createWindowEvents();
loadFPS()
requestAnimationFrame(gameLoop);
