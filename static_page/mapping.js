import {radii} from "./render.js"

export var boxes = []
export var level;

export class Box {
    constructor (x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}


export async function loadLevel(level) {
    for (var upperIndex = 0; upperIndex < level.length; upperIndex++) {
        var upperElement = level[upperIndex];
        for (var lowerIndex = 0; lowerIndex < upperElement.length; lowerIndex++) {
            var lowerElement = upperElement[lowerIndex];
            if (lowerElement === 1) {
                let g = 2 * radii
                boxes.push(new Box(lowerIndex * g, upperIndex * g, g, g));
            }
        }
    }
}