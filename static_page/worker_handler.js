import { loadLevel } from "./mapping.js";
import { handlePlayerCount } from "./menu.js";
export var worker;
export var playerData, ping1, playerUUID;

var actions = {
    "data" : (e) => {playerData = e.data; ping1 = e.ping; console.log(e.ping)},
    "level" : (e) => {loadLevel(e.level); },
    "uuid" : (e) => {playerUUID = e.uuid},
    "playerCount" : (e) => {handlePlayerCount(e.count);}
}

export function openWebWorker(url) {
    worker = new Worker("socket_worker.js", {type: "module"})

    worker.onmessage = (event) => {
        const data = event.data;
        for (const prop in actions) { prop == data.type ? actions[prop](data) : null}
    };

    worker.postMessage({type: "nS", url: url})
}

export function switchServer(url) {
    worker.postMessage({type: "nS", url: url})
}

export function sendMoveData(xvel, yvel) {
    worker.postMessage({type: "m", x: xvel, y: yvel})
}
export function createWorkerWindowEvents() {
    window.onbeforeunload = function () {
        worker.postMessage({type: "d"})
    };
}
