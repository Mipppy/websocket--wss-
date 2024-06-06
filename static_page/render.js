import { images } from "./imagehandler.js";
import { playerData, playerUUID } from "./worker_handler.js";

export let canvas;
export let context;
export let currentPlayer;
export const radii = 40;

export function createRenderWindowEvents() {
    window.onresize = () => {
        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;
    }
}

export function initCanvas() {
    canvas = document.getElementById("gamewindow");
    context = canvas.getContext("2d");
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
}

function areBytewiseEqual(a, b) {
    return indexedDB.cmp(a, b) === 0;
  }

export function renderPlayers() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    currentPlayer = playerData.find(player =>  areBytewiseEqual(player.uuid, playerUUID));
    if (!currentPlayer) return;
    context.fillStyle = 'rgba(255, 0, 0, 0.5)';
    const playerImage = images.get("player");
    const halfCanvasWidth = canvas.width / 2;
    const halfCanvasHeight = canvas.height / 2;
    const adjustedRadii = radii * 2.5;
    const strokeRadii = radii;
    playerData.forEach(player => {

        let [x, y] = getRelative(player.x, player.y);
        if (player.uuid === playerUUID) {
            x = halfCanvasWidth;
            y = halfCanvasHeight;
        } else {
            x += radii;
            y += radii;
        } 
        if (x < 0 || y > canvas.width || x < 0 || y > canvas.height) {
            return
        }
        context.save();
        context.beginPath();
        context.arc(x, y, radii * 1.5, 0, Math.PI * 2, true);
        context.clip();
        context.drawImage(playerImage, x - radii, y - radii, adjustedRadii, adjustedRadii);

        context.beginPath();
        context.arc(x, y, strokeRadii, 0, Math.PI * 2, true);
        context.fill();
        context.restore();
    });
}

export function renderBoxes(boxes) {
    context.fillStyle = 'rgba(0, 0, 255, 0.5)';
    boxes.forEach(box => {
        const [relativeX, relativeY] = getRelative(box.x, box.y);
        context.beginPath();
        context.drawImage(images.get("wall"), relativeX + radii, relativeY + radii, box.width, box.height);
        context.rect(relativeX + radii, relativeY + radii, box.width, box.height)
        context.fill();
    });
}

export function getRelative(x, y) {
    if (!currentPlayer) return [0, 0];
    const halfCanvasWidth = canvas.width / 2;
    const halfCanvasHeight = canvas.height / 2;
    const relativeX = Math.round((x - currentPlayer.x + halfCanvasWidth) - radii);
    const relativeY = Math.round((y - currentPlayer.y + halfCanvasHeight) - radii);
    return [relativeX, relativeY];
}
export function getPredictedRelative(x, y) {
    if (!currentPlayer) return [0, 0];
    const halfCanvasWidth = canvas.width / 2;
    const halfCanvasHeight = canvas.height / 2;
    const relativeX = Math.round((x - predictedX + halfCanvasWidth) - radii);
    const relativeY = Math.round((y - predictedY + halfCanvasHeight) - radii);
    return [relativeX, relativeY];
}
