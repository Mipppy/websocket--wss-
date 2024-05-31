import { createEngineWindowEvents} from "./engine.js";
import { createRenderWindowEvents } from "./render.js";
import { createWorkerWindowEvents } from "./worker_handler.js";

export function createWindowEvents() {
    createEngineWindowEvents();
    createRenderWindowEvents();
    createWorkerWindowEvents();
}