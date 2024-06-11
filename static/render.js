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

function lineIntersectsRect(x1, y1, x2, y2, rect) {
    const { x, y, width, height } = rect;

    return (
        lineIntersectsLine(x1, y1, x2, y2, x, y, x + width, y) || 
        lineIntersectsLine(x1, y1, x2, y2, x, y, x, y + height) || 
        lineIntersectsLine(x1, y1, x2, y2, x + width, y, x + width, y + height) ||
        lineIntersectsLine(x1, y1, x2, y2, x, y + height, x + width, y + height)
    );
}

function lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
    const det = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3);
    if (det === 0) {
        return false;
    } else {
        const lambda = ((y4 - y3) * (x4 - x1) + (x3 - x4) * (y4 - y1)) / det;
        const gamma = ((y1 - y2) * (x4 - x1) + (x2 - x1) * (y4 - y1)) / det;
        return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
    }
}

export function renderPlayers() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    currentPlayer = playerData.find(player => areBytewiseEqual(player.uuid, playerUUID));
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
            return;
        }

        const lineLength = 700;  
        const angleRad = (player.angle / 256) * (2 * Math.PI); 
        const endX = x + lineLength * Math.cos(angleRad);
        const endY = y + lineLength * Math.sin(angleRad);

        context.save();
        context.beginPath();
        context.arc(x, y, radii * 1.5, 0, Math.PI * 2, true);
        context.clip();
        context.drawImage(playerImage, x - radii, y - radii, adjustedRadii, adjustedRadii);

        context.beginPath();
        context.arc(x, y, strokeRadii, 0, Math.PI * 2, true);
        context.fill();
        context.restore();

        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(endX, endY);
        context.strokeStyle = 'lime';
        context.lineWidth = 2;
        context.stroke();
    });

    playerData.forEach(player => {
        let hitboxColor = 'blue';
        let [x, y] = getRelative(player.x, player.y);
        if (player.uuid !== playerUUID) {
            x += radii;
            y += radii;
        } 
        if (x < 0 || y > canvas.width || x < 0 || y > canvas.height) {
            return;
        }

        const rect = {
            x: x - radii,
            y: y - radii,
            width: radii * 2,
            height: radii * 2
        };

        playerData.forEach(otherPlayer => {
            if (otherPlayer.uuid !== player.uuid) {
                let [otherX, otherY] = getRelative(otherPlayer.x, otherPlayer.y);
                if (otherPlayer.uuid === playerUUID) {
                    otherX = canvas.width / 2;
                    otherY = canvas.height / 2;
                } else {
                    otherX += radii;
                    otherY += radii;
                }
                const angleRad = (otherPlayer.angle / 256) * (2 * Math.PI);
                const endX = otherX + 700 * Math.cos(angleRad);
                const endY = otherY + 700 * Math.sin(angleRad);

                if (lineIntersectsRect(otherX, otherY, endX, endY, rect)) {
                    hitboxColor = 'orange';
                }
            }
        });
        context.fillStyle = hitboxColor;
        context.beginPath();
        context.arc(x, y, strokeRadii, 0, Math.PI * 2, true);
        context.fill();
    });
}

export function renderBoxes(boxes) {
    context.fillStyle = 'rgba(0, 0, 255, 0.5)';
    boxes.forEach(box => {
        const [relativeX, relativeY] = getRelative(box.x, box.y);
        context.beginPath();
        context.drawImage(images.get("wall"), relativeX + radii, relativeY + radii, box.width, box.height);
        context.rect(relativeX + radii, relativeY + radii, box.width, box.height);
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
