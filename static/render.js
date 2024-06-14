import { images } from "./imagehandler.js";
import { boxes } from "./mapping.js";
import { playerData, playerUUID } from "./worker_handler.js";

export let canvas;
export let context;
export let currentPlayer;
export const radii = 40;
let lights = [];
let rays = [];

export function createRenderWindowEvents() {
    window.onresize = () => {
        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;
    };
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
    lights = [];
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
        if (player.flashLightStatus || currentPlayer === player) {

        context.save();
        context.beginPath();
        context.arc(x, y, radii * 1.5, 0, Math.PI * 2, true);
        context.clip();
        context.drawImage(playerImage, x - radii, y - radii, adjustedRadii, adjustedRadii);

        context.beginPath();
        context.arc(x, y, strokeRadii, 0, Math.PI * 2, true);
        context.fill();
        context.restore();
            if (player.flashLightStatus) {
                const playerAngle = (player.angle / 256) * 360;
                let light = new Light(new Vector(x, y), 700, 20, 'rgba(255,255,255,0.6)');
                light.angle = playerAngle;
                lights.push(light);
            }
        }
    });

    shineLights();
    renderBorderLines()
    // playerData.forEach(player => {
    //     let hitboxColor = 'blue';
    //     let [x, y] = getRelative(player.x, player.y);
    //     if (player.uuid !== playerUUID) {
    //         x += radii;
    //         y += radii;
    //     }
    //     if (x < 0 || y > canvas.width || x < 0 || y > canvas.height) {
    //         return;
    //     }


    //     // This might be used in the future for detection of objects without
    //     // Using every ray.  It likely won't be used though, and only serves
    //     // to ruin performance.

    //     // playerData.forEach(otherPlayer => {
    //     //     if (otherPlayer.uuid !== player.uuid) {
    //     //         let [otherX, otherY] = getRelative(otherPlayer.x, otherPlayer.y);
    //     //         if (otherPlayer.uuid === playerUUID) {
    //     //             otherX = canvas.width / 2;
    //     //             otherY = canvas.height / 2;
    //     //         } else {
    //     //             otherX += radii;
    //     //             otherY += radii;
    //     //         }
    //     //         const angleRad = (otherPlayer.angle / 256) * (2 * Math.PI);
    //     //         for (let i = -10; i <= 10; i += 5) {
    //     //             const rayX = otherX + 700 * Math.cos(angleRad + (i * Math.PI / 180));
    //     //             const rayY = otherY + 700 * Math.sin(angleRad + (i * Math.PI / 180));
    //     //             rays.push([otherX, otherY, rayX, rayY]);
    //     //         }
    //     //     }
    //     // });

    //     context.fillStyle = hitboxColor;
    //     context.beginPath();
    //     context.arc(x, y, strokeRadii, 0, Math.PI * 2, true);
    //     context.fill();
    // });

}

function renderBorderLines() {
    context.strokeStyle = 'rgba(0, 0, 255, 0.5)';
    context.lineWidth = 2;
    context.beginPath();
    const borderPoints = [
        { x: 0, y: 0 },
        { x: 0, y: 65535 },
        { x: 65535, y: 65535 },
        { x: 65535, y: 0 },
        { x: 0, y: 0 }
    ];
    borderPoints.forEach(point => {
        const [relativeX, relativeY] = getRelative(point.x, point.y);
        context.lineTo(relativeX + radii, relativeY + radii);
    });
    context.stroke();
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

export class Vector {
    constructor(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    }
}

class Light {
    constructor(_position, _radius, _angleSpread, _color) {
        this.color = _color;
        this.radius = _radius;
        this.angleSpread = _angleSpread;
        this.position = _position;
        this.angle = Math.random() * 180;
    }
}

export class Block {
    constructor(_position, _width, _height) {
        this.position = _position;
        this.width = _width;
        this.height = _height;
        this.visible = false;
        this.opacity = 0;
        this.intersectionCount = 0;
    }
}

function shineLights() {
    lights.forEach(light => {
        context.strokeStyle = light.color;
        shineLight(light);
        renderBlocksHitByLight(light);
    });
}

function shineLight(light) {
    const startAngle = (light.angle - light.angleSpread / 2) * (Math.PI / 180);
    const endAngle = (light.angle + light.angleSpread / 2) * (Math.PI / 180);
    const step = (endAngle - startAngle) / 55;
    rays = [];

    for (let angle = startAngle; angle <= endAngle; angle += step) {
        let endX = light.position.x + light.radius * Math.cos(angle);
        let endY = light.position.y + light.radius * Math.sin(angle);
        let closestIntersection = null;
        let closestDistance = Infinity;
        let firstIntersectionBox = null;

        for (let box of boxes) {
            const [relX, relY] = getRelative(box.position.x, box.position.y);
            const rect = {
                x: relX + radii * 0.999,
                y: relY + radii * 0.999,
                width: box.width,
                height: box.height
            };
            const intersection = lineRectIntersectionPoint(light.position.x, light.position.y, endX, endY, rect);
            if (intersection) {
                const dist = distance(light.position.x, light.position.y, intersection[0], intersection[1]);
                if (dist < closestDistance) {
                    closestIntersection = intersection;
                    closestDistance = dist;
                    firstIntersectionBox = box;
                }
            }
        }
        if (firstIntersectionBox) {
            firstIntersectionBox.visible = true;
            firstIntersectionBox.intersectionCount++;
            const distanceToSomething = distance(closestIntersection[0], closestIntersection[1], light.position.x, light.position.y)
            firstIntersectionBox.opacity = 1 - (distanceToSomething * (1 - (firstIntersectionBox.intersectionCount / 100)) / 700) / ((0.9 + (distanceToSomething / 700) * .1))
            endX = closestIntersection[0];
            endY = closestIntersection[1];
        }
        context.beginPath();
        context.moveTo(light.position.x, light.position.y);
        context.lineTo(endX, endY);
        context.stroke();

        rays.push({ x1: light.position.x, y1: light.position.y, x2: endX, y2: endY });

    }
    for (const ray of rays) {
        for (let player of playerData) {
            if (player.flashLightStatus) return
            const [x,y] = getRelative(player.x, player.y)
            const int = lineCircleIntersectionPoint(ray.x1, ray.y1, ray.x2, ray.y2,x+radii, y+radii, radii)
            if (int) {
                context.save();
                context.beginPath();
                context.arc(x + radii, y + radii, radii * 1.5, 0, Math.PI * 2, true);
                context.clip();
                context.drawImage(images.get("player"), x, y, radii * 2.5, radii * 2.5);
        
                context.beginPath();
                context.arc(x + radii, y + radii, radii, 0, Math.PI * 2, true);
                context.fill();
                context.restore();
            }
        }
    }
}



function renderBlocksHitByLight() {
    boxes.forEach(box => {
        context.fillStyle = `rgba(0, 128, 0, ${box.opacity})`;
        if (box.visible) {
            const [relX, relY] = getRelative(box.position.x, box.position.y);
            context.beginPath();
            context.rect(relX + radii, relY + radii, box.width, box.height);
            context.fill();
        }
        box.visible = false
        box.opacity = 0
        box.intersectionCount = 0
    });
}



function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}


function lineRectIntersectionPoint(x1, y1, x2, y2, rect) {
    const { x, y, width, height } = rect;
    const topLeft = { x, y };
    const topRight = { x: x + width, y };
    const bottomLeft = { x, y: y + height };
    const bottomRight = { x: x + width, y: y + height };

    const intersections = [];

    if (lineIntersectsLine(x1, y1, x2, y2, topLeft.x, topLeft.y, topRight.x, topRight.y)) {
        intersections.push(lineLineIntersectionPoint(x1, y1, x2, y2, topLeft.x, topLeft.y, topRight.x, topRight.y));
    }
    if (lineIntersectsLine(x1, y1, x2, y2, topRight.x, topRight.y, bottomRight.x, bottomRight.y)) {
        intersections.push(lineLineIntersectionPoint(x1, y1, x2, y2, topRight.x, topRight.y, bottomRight.x, bottomRight.y));
    }
    if (lineIntersectsLine(x1, y1, x2, y2, bottomRight.x, bottomRight.y, bottomLeft.x, bottomLeft.y)) {
        intersections.push(lineLineIntersectionPoint(x1, y1, x2, y2, bottomRight.x, bottomRight.y, bottomLeft.x, bottomLeft.y));
    }
    if (lineIntersectsLine(x1, y1, x2, y2, bottomLeft.x, bottomLeft.y, topLeft.x, topLeft.y)) {
        intersections.push(lineLineIntersectionPoint(x1, y1, x2, y2, bottomLeft.x, bottomLeft.y, topLeft.x, topLeft.y));
    }

    if (intersections.length === 0) {
        return null;
    }

    intersections.sort((a, b) => distance(x1, y1, a[0], a[1]) - distance(x1, y1, b[0], b[1]));
    return intersections[0];
}

function lineLineIntersectionPoint(x1, y1, x2, y2, x3, y3, x4, y4) {
    const det = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3);
    if (det === 0) {
        return null;
    } else {
        const lambda = ((y4 - y3) * (x4 - x1) + (x3 - x4) * (y4 - y1)) / det;
        const intersectionX = x1 + lambda * (x2 - x1);
        const intersectionY = y1 + lambda * (y2 - y1);
        return [intersectionX, intersectionY];
    }
}

function lineCircleIntersectionPoint(x1, y1, x2, y2, cx, cy, radius) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const fx = x1 - cx;
    const fy = y1 - cy;

    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - radius * radius;

    const discriminant = b * b - 4 * a * c;

    if (discriminant < 0) {
        // No intersection, return null
        return null;
    } else if (discriminant === 0) {
        // Tangent, return one point of intersection
        const t = -b / (2 * a);
        const intersectionX = x1 + t * dx;
        const intersectionY = y1 + t * dy;
        return [[intersectionX, intersectionY]];
    } else {
        // Two points of intersection
        const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
        const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);
        const intersection1X = x1 + t1 * dx;
        const intersection1Y = y1 + t1 * dy;
        const intersection2X = x1 + t2 * dx;
        const intersection2Y = y1 + t2 * dy;
        return [[intersection1X, intersection1Y], [intersection2X, intersection2Y]];
    }
}