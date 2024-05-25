export var canvas;
export var context;

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
    context.beginPath();
    players.forEach(player => {
        context.beginPath();
        context.arc(player.x, player.y, 40, 0, 2 * Math.PI);
        context.stroke();
    });
}
