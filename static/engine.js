import { currentPlayer, renderPlayers, } from "./render.js";
import { canvas } from "./render.js";
import { ping1 } from "./worker_handler.js";
import { $BOOLBYTE } from "./boolbyte.js";
export var lastX, lastY, stats, pingPanel;

// Waste of a byte, might be able to cram more stuff in it.
export var flashLightState = true

export var moveDataBinary = new $BOOLBYTE();
export var playerAngle = new Uint8Array(1);
playerAngle[0] = 0

export function createEngineWindowEvents() {
    window.onkeydown = function (event) {
        switch (event.key) {
            case 'w':
                moveDataBinary.set(4, true);
                break;
            case 'a':
                moveDataBinary.set(5, true);
                break;
            case 's':
                moveDataBinary.set(6, true);
                break;
            case 'd':
                moveDataBinary.set(7, true);
                break;
        }
    };

    window.onkeyup = function (event) {
        switch (event.key) {
            case 'w':
                moveDataBinary.set(4, false);
                break;
            case 'a':
                moveDataBinary.set(5, false);
                break;
            case 's':
                moveDataBinary.set(6, false);
                break;
            case 'd':
                moveDataBinary.set(7, false);
                break;
            case 'e':
                flashLightState = !flashLightState
        }
    };

    window.onmousemove = function (pos) {
        // Angle is between 0-255 to fit in one byte :)
        var angle = Math.round(Math.atan2(pos.clientY - canvas.height / 2, pos.clientX - canvas.width / 2) * 256 / (2 * Math.PI) + 256) % 256;
        playerAngle[0] = angle;
    };
}

function checkIfMoved() {
    try {
        if (lastX !== currentPlayer.x || lastY !== currentPlayer.y) {
            lastX = currentPlayer.x;
            lastY = currentPlayer.y;
            return true;
        }
        return false;
    } catch (error) {
        return false;
    }
}

var loop = 0;
let lastFrameTime = performance.now();
const frameRate = 60;
const frameInterval = 1000 / frameRate;

export function gameLoop() {
    loop++;
    const currentTime = performance.now();
    const elapsedTime = currentTime - lastFrameTime;
    try { stats.begin() } catch (e) { }
    renderPlayers();
    try { pingPanel.update(ping1, ping1 < 25 ? 25 : (ping1 < 75 ? 75 : 200)); } catch (error) { }
    lastFrameTime = performance.now() - (elapsedTime % frameInterval);
    try { stats.end() } catch (e) { }
    requestAnimationFrame(gameLoop);
}

export function loadFPS() {
    var script = document.createElement('script');
    script.src = 'https://mrdoob.github.io/stats.js/build/stats.min.js';
    document.head.appendChild(script);
    script.onload = () => {
        console.log("Loaded stats.js");
        stats = new Stats();
        document.body.appendChild(stats.dom);
        pingPanel = stats.addPanel(new Stats.Panel('PING', '#f08', '#201'));
        stats.showPanel(0)
    };
}
