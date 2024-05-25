import * as game from "./gamesocket.js"
import { initCanvas } from "./render.js";
import { createWindowEvents } from "./windowevents.js";
import {gameLoop} from "./engine.js"
initCanvas(document);
game.initWebSocket();
createWindowEvents();
requestAnimationFrame(gameLoop);
