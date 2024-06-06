import { moveDataBinary } from "./engine.js";
import { loadLevel } from "./mapping.js";
import { handlePlayerCount } from "./menu.js";
export var worker;
export var playerData, ping1, playerUUID;

var actions = {
    "data" : (e) => {playerData = e.data; ping1 = e.ping; handlePlayerCount(e.count)},
    "level" : (e) => {loadLevel(e.level); },
    "uuid" : (e) => {playerUUID = e.uuid},
    "keypresses" : (e) => {giveKeypresses()}
}

export function openWebWorker(url) {
    worker = new Worker("/static/socket_worker.js", {type: "module"})

    worker.onmessage = (event) => {
        const data = event.data;
        for (const prop in actions) { prop == data.type ? actions[prop](data) : null}
    };

    worker.postMessage({type: "nS", url: url})
}

export function switchServer(url) {
    worker.postMessage({type: "nS", url: url})
}

export function createWorkerWindowEvents() {
    window.onbeforeunload = function () {
        worker.postMessage({type: "d"})
    };
}

export function giveKeypresses() {
    worker.postMessage({type: "k", k: moveDataBinary.uint[0].toString(2).split("").reverse()})
}

export function startErUp() {
    worker.postMessage({type: "g"})
}