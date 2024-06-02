import { loadFPS } from "./engine.js";
import { startGame } from "./script.js";
import { openWebWorker, switchServer } from "./worker_handler.js";
var server = document.getElementById("server")
// openWebWorker(server.options[server.selectedIndex].value)
openWebWorker("http://localhost:8000")

document.getElementById("joinGameButton").onclick = (event) => {
    cleanupGUI()
    startGame()
}

function cleanupGUI() {
    var ids = ["joinGameContainer"]

    ids.forEach((id) => {
        document.getElementById(id).style.display = "none"
    })
}

server.onchange = (event) => {
    try {
        switchServer(event.target.options[event.target.selectedIndex].value)
    } catch (e) { }
}

export function handlePlayerCount(count) {
    try {
        document.getElementById("playerCount").innerText = count

    } catch (e) {}
}