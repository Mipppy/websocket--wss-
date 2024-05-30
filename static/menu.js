import { changeWebSocket, initWebSocket } from "./gamesocket.js";
import { startGame } from "./script.js";
initWebSocket("https://wwww-3ods.onrender.com");


document.getElementById("joinGameButton").onclick = (event) => {
    cleanupGUI()
    startGame()
}

function cleanupGUI() {
    var ids = ["joinGameContainer"]

    ids.forEach((id) => {
        document.getElementById(id).remove()
    })
}

export function handleConnectionError() {
    var s = document.getElementById("error")
    s.style.display = "block"
    s.innerText = "Failed to connect to server"
}
document.getElementById("server").onchange = (event) => {
    try {
        changeWebSocket(event.target.options[event.target.selectedIndex].value)
    } catch (e) { }
}