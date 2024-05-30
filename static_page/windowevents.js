import { createEngineWindowEvents} from "./engine.js";
import { createGameWindowEvents } from "./gamesocket.js";
import { createRenderWindowEvents } from "./render.js";

export function createWindowEvents() {
    createEngineWindowEvents();
    createGameWindowEvents();
    createRenderWindowEvents();
}