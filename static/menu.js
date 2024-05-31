import { startGame } from "./script.js";
import { openWebWorker, switchServer } from "./worker_handler.js";
// initWebSocket("https://wwww-3ods.onrender.com");

openWebWorker("https://wwww-3ods.onrender.com")

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

document.getElementById("server").onchange = (event) => {
    try {
        switchServer(event.target.options[event.target.selectedIndex].value)
    } catch (e) { }
}

export function handlePlayerCount(count) {
    try {
        document.getElementById("playerCount").innerText = count

    } catch (e) {}
}