import { playerUUID } from "./gamesocket.js";
import { images } from "./imagehandler.js";

export var canvas;
export var context;
export var currentPlayer;
export var radii = 40;

export function createRenderWindowEvents() {
    window.onresize = function () {
        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;
    }
}

export function initCanvas(document) {
    canvas = document.getElementById("gamewindow");
    context = canvas.getContext("2d");
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
}

export function renderPlayers(players) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    let currentPlayer1 = players.find(player => player.uuid === playerUUID);
    currentPlayer = currentPlayer1;
    if (!currentPlayer1) return;

    const playerImage = images.get("player");
    const halfCanvasWidth = canvas.width / 2;
    const halfCanvasHeight = canvas.height / 2;
    const adjustedRadii = radii * 2.5;
    const strokeRadii = radii;

    players.forEach(player => {
        let x, y;

        if (player.uuid === playerUUID) {
            x = halfCanvasWidth;
            y = halfCanvasHeight;
        } else {
            [x, y] = getRelative(player.x, player.y);
            x = Math.round(x) + radii;
            y = Math.round(y) + radii;
        }

        context.save();
        context.beginPath();
        context.arc(x, y, radii * 1.5, 0, Math.PI * 2, true);
        context.clip();
        context.drawImage(playerImage, x - radii, y - radii, adjustedRadii, adjustedRadii);

        context.beginPath();
        context.arc(x, y, strokeRadii, 0, Math.PI * 2, true);
        context.stroke();
        context.restore();
    });
}


export function renderBoxes(boxes) {
    for (var box of boxes) {
        context.beginPath(); 
        context.drawImage(images.get("wall"), getRelative(box.x, box.y)[0] + radii, getRelative(box.x, box.y)[1] + radii, box.width, box.height);
        context.stroke(); 
    }
}

export function getRelative(x, y) {
    if (!currentPlayer) return [0,0];
    let relativeX = (x - currentPlayer.x + canvas.width / 2) - radii;
    let relativeY = (y - currentPlayer.y + canvas.height / 2) - radii;
    return [relativeX, relativeY];
}
