import { images } from "./imagehandler.js";
import { boxes } from "./mapping.js";
import { playerData, playerUUID } from "./worker_handler.js";

export let canvas;
export let context;
export let currentPlayer;
export const radii = 40;
let lights = [];

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

        context.save();
        context.beginPath();
        context.arc(x, y, radii * 1.5, 0, Math.PI * 2, true);
        context.clip();
        context.drawImage(playerImage, x - radii, y - radii, adjustedRadii, adjustedRadii);

        context.beginPath();
        context.arc(x, y, strokeRadii, 0, Math.PI * 2, true);
        context.fill();
        context.restore();

        const playerAngle = (player.angle / 256) * 360;
        let light = new Light(new Vector(x, y), 700, 20, 'rgba(255,255,255,0.6)');
        light.angle = playerAngle;
        lights.push(light);
    });

    // Render lights for players
    shineLights();

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
                let rays = [];
                const angleRad = (otherPlayer.angle / 256) * (2 * Math.PI);
                for (let i = -10; i <= 10; i += 5) {
                    rays.push([otherX + 700 * Math.cos(angleRad + (i * Math.PI / 180)), otherY + 700 * Math.sin(angleRad + (i * Math.PI / 180))]);
                }
                for (const ray of rays) {
                    if (lineIntersectsRect(otherX, otherY, ray[0], ray[1], rect)) {
                        hitboxColor = 'orange';
                    }
                }
            }
        });
        context.fillStyle = hitboxColor;
        context.beginPath();
        context.arc(x, y, strokeRadii, 0, Math.PI * 2, true);
        context.fill();
    });
}

export function renderBoxes() {
    context.fillStyle = 'rgba(0, 0, 255, 0.5)';
    boxes.forEach(box => {
        const [relativeX, relativeY] = getRelative(box.position.x, box.position.y);
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

export function Vector(x, y) {
    this.x = x || 0;
    this.y = y || 0;
}

function Light(_position, _radius, _angleSpread, _color) {
    this.color = _color;
    this.radius = _radius;
    this.angleSpread = _angleSpread;
    this.position = _position;
    this.angle = Math.random() * 180;
}

export function Block(_position, _width, _height) {
    this.position = _position;
    this.width = _width;
    this.height = _height;
    this.visible = false;
}

function shineLights() {
    lights.forEach(light => {
        context.strokeStyle = light.color;
        shineLight(light);
    });
}

function shineLight(light) {
    const startAngle = (light.angle - light.angleSpread / 2) * (Math.PI / 180);
    const endAngle = (light.angle + light.angleSpread / 2) * (Math.PI / 180);

    const endX1 = light.position.x + light.radius * Math.cos(startAngle);
    const endY1 = light.position.y + light.radius * Math.sin(startAngle);
    const endX2 = light.position.x + light.radius * Math.cos(endAngle);
    const endY2 = light.position.y + light.radius * Math.sin(endAngle);

    context.beginPath();
    context.moveTo(light.position.x, light.position.y);
    context.lineTo(endX1, endY1);
    context.lineTo(endX2, endY2);
    context.closePath();
    context.fillStyle = light.color;
    context.fill();

    renderBlocks(light);
}

function renderBlocks(light) {
    const quadtree = new Quadtree(0, new Rectangle(0, 0, canvas.width, canvas.height));
    boxes.forEach(box => quadtree.insert(box));

    const visibleBlocks = quadtree.retrieve({
        x: getRelative(light.position.x - light.radius,light.position.y - light.radius )[0],
        y:getRelative(light.position.x - light.radius,light.position.y - light.radius )[1],
        width: light.radius * 2,
        height: light.radius * 2
    });
    visibleBlocks.forEach(block => {
        const rect = {
            x: block.position.x,
            y: block.position.y,
            width: block.width,
            height: block.height
        };
        [rect.x, rect.y] = getRelative(rect.x, rect.y)
        if (
            lineIntersectsRect(light.position.x, light.position.y, light.position.x + light.radius, light.position.y, rect) ||
            lineIntersectsRect(light.position.x, light.position.y, light.position.x, light.position.y + light.radius, rect) ||
            lineIntersectsRect(light.position.x, light.position.y, light.position.x - light.radius, light.position.y, rect) ||
            lineIntersectsRect(light.position.x, light.position.y, light.position.x, light.position.y - light.radius, rect)
        ) {
            context.fillStyle = block.visible ? 'rgba(0, 0, 255, 0.5)' : 'rgba(0, 255, 0, 0.5)';
            context.fillRect(rect.x + radii, rect.y + radii, block.width, block.height);
        }
    });
}

// Define the Rectangle class
class Rectangle {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    contains(point) {
        return (
            point.x >= this.x &&
            point.x < this.x + this.width &&
            point.y >= this.y &&
            point.y < this.y + this.height
        );
    }

    intersects(range) {
        return !(
            range.x > this.x + this.width ||
            range.x + range.width < this.x ||
            range.y > this.y + this.height ||
            range.y + range.height < this.y
        );
    }
}

// Quadtree implementation for spatial partitioning
class Quadtree {
    constructor(bounds, maxObjects = 10, maxLevels = 4, level = 0) {
        this.bounds = bounds;
        this.maxObjects = maxObjects;
        this.maxLevels = maxLevels;
        this.level = level;
        this.objects = [];
        this.nodes = [];
    }

    split() {
        const subWidth = this.bounds.width / 2;
        const subHeight = this.bounds.height / 2;
        const x = this.bounds.x;
        const y = this.bounds.y;

        this.nodes[0] = new Quadtree({
            x: x + subWidth,
            y: y,
            width: subWidth,
            height: subHeight
        }, this.maxObjects, this.maxLevels, this.level + 1);

        this.nodes[1] = new Quadtree({
            x: x,
            y: y,
            width: subWidth,
            height: subHeight
        }, this.maxObjects, this.maxLevels, this.level + 1);

        this.nodes[2] = new Quadtree({
            x: x,
            y: y + subHeight,
            width: subWidth,
            height: subHeight
        }, this.maxObjects, this.maxLevels, this.level + 1);

        this.nodes[3] = new Quadtree({
            x: x + subWidth,
            y: y + subHeight,
            width: subWidth,
            height: subHeight
        }, this.maxObjects, this.maxLevels, this.level + 1);
    }

    getIndex(rect) {
        const indexes = [];
        const verticalMidpoint = this.bounds.x + (this.bounds.width / 2);
        const horizontalMidpoint = this.bounds.y + (this.bounds.height / 2);

        const topQuadrant = (rect.y < horizontalMidpoint && rect.y + rect.height < horizontalMidpoint);
        const bottomQuadrant = (rect.y > horizontalMidpoint);

        if (rect.x < verticalMidpoint && rect.x + rect.width < verticalMidpoint) {
            if (topQuadrant) {
                indexes.push(1);
            }
            if (bottomQuadrant) {
                indexes.push(2);
            }
        }

        if (rect.x > verticalMidpoint) {
            if (topQuadrant) {
                indexes.push(0);
            }
            if (bottomQuadrant) {
                indexes.push(3);
            }
        }

        return indexes;
    }

    insert(rect) {
        if (this.nodes.length) {
            const indexes = this.getIndex(rect);
            for (let i = 0; i < indexes.length; i++) {
                this.nodes[indexes[i]].insert(rect);
            }
            return;
        }

        this.objects.push(rect);

        if (this.objects.length > this.maxObjects && this.level < this.maxLevels) {
            if (!this.nodes.length) {
                this.split();
            }

            for (let i = 0; i < this.objects.length; i++) {
                const indexes = this.getIndex(this.objects[i]);
                for (let j = 0; j < indexes.length; j++) {
                    this.nodes[indexes[j]].insert(this.objects[i]);
                }
            }

            this.objects = [];
        }
    }

    retrieve(rect) {
        const indexes = this.getIndex(rect);
        let returnObjects = this.objects;

        if (this.nodes.length) {
            for (let i = 0; i < indexes.length; i++) {
                returnObjects = returnObjects.concat(this.nodes[indexes[i]].retrieve(rect));
            }
        }

        return returnObjects;
    }

    clear() {
        this.objects = [];

        for (let i = 0; i < this.nodes.length; i++) {
            if (this.nodes[i]) {
                this.nodes[i].clear();
            }
        }

        this.nodes = [];
    }
}
