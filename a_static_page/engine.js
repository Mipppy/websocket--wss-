import { canvas, context } from "./render.js";

export var x = Math.floor(Math.random() * 1000);
export var y = Math.floor(Math.random() * 1000);
export var speed = 0.5; 
export var friction = 0.9;
export var velocityX = 0;
export var velocityY = 0;

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
}

export function createEngineWindowEvents() {
    window.onkeydown = function(event) {
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

    window.onkeyup = function(event) {
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

function move() {
    velocityX *= friction;
    velocityY *= friction;

    x = Math.max(0, Math.min(canvas.width, x + velocityX));
    y = Math.max(0, Math.min(canvas.height, y + velocityY));
}

export function gameLoop() {
    handleKeypresses();
    move();
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
