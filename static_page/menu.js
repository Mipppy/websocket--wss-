import { changeWebSocket, initWebSocket } from "./gamesocket.js";
import { startGame } from "./script.js";
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
        console.log(event.target)
        var promise = changeWebSocket(event.target.options[event.target.selectedIndex].value)
        alert("Switching servers")
        promise.then(() => {
            alert("Switched")
        })
    } catch (e) { }
}