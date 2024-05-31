import { currentPlayer, renderBoxes, renderPlayers } from "./render.js";
import { boxes } from "./mapping.js"
import { playerData, sendMoveData, ping1 } from "./worker_handler.js";
export var x = Math.floor(Math.random() * 1000);
export var y = Math.floor(Math.random() * 1000);
export var speed = 1.15;
export var friction = 0.9;
export var velocityX = 0;
export var velocityY = 0;
export var lastX, lastY, stats, pingPanel;

export var keypresses = {
    w: false,
    a: false,
    s: false,
    d: false,
};

export function handleKeypresses() {
    if (keypresses.w) velocityY -= speed;
    if (keypresses.a) velocityX -= speed;
    if (keypresses.s) velocityY += speed;
    if (keypresses.d) velocityX += speed;
    if (keypresses.w && (keypresses.a || keypresses.d)) { velocityX *= 0.95; velocityY *= 0.95; }
    if (keypresses.s && (keypresses.a || keypresses.d)) { velocityX *= 0.95; velocityY *= 0.95; }
}

export function createEngineWindowEvents() {
    window.onkeydown = function (event) {
        switch (event.key) {
            case 'w':
                keypresses.w = true;
                break;
            case 'a':
                keypresses.a = true;
                break;
            case 's':
                keypresses.s = true;
                break;
            case 'd':
                keypresses.d = true;
                break;
        }
    };

    window.onkeyup = function (event) {
        switch (event.key) {
            case 'w':
                keypresses.w = false;
                break;
            case 'a':
                keypresses.a = false;
                break;
            case 's':
                keypresses.s = false;
                break;
            case 'd':
                keypresses.d = false;
                break;
        }
    };
}

export function move() {
    velocityX *= friction;
    velocityY *= friction;

    if (velocityX !== 0 || velocityY !== 0) {

        sendMoveData(Math.round((velocityX + Number.EPSILON) * 1000) / 1000, Math.round((velocityY + Number.EPSILON) * 1000) / 1000);
    }
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

    if (Math.abs(velocityX) < 0.0001) velocityX = 0;
    if (Math.abs(velocityY) < 0.0001) velocityY = 0;

    updatePredictedPosition();

    reconcilePosition();

    if (!checkIfMoved() || loop < 60) {
        try {
            renderPlayers(playerData);
        } catch (error) {}
        try {
            renderBoxes(boxes);
        } catch (error) { console.log(error)}
    }

    try {
        console.log(stats)
        console.log(pingPanel)
        console.log(ping1)
        if (stats && pingPanel && ping1) {
            pingPanel.update(ping1, ping1 < 75 ? 75 : 200);

        }
    } catch (error) {console.log(error)}

    if (elapsedTime >= frameInterval) {
        // This limits the movement speed to 60 times a second, so people with higher hertz monitors don't move faster, but letting them render faster
        lastFrameTime = performance.now() - (elapsedTime % frameInterval);
        handleKeypresses();
        move();
    }
    requestAnimationFrame(gameLoop);
}


export let predictedX = 0;
export let predictedY = 0;

function updatePredictedPosition() {
    velocityX *= friction;
    velocityY *= friction;

    predictedX += velocityX;
    predictedY += velocityY;
}

function reconcilePosition() {
    try {
        predictedX = currentPlayer.x;
        predictedY = currentPlayer.y;
    } catch (e) {
    }
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