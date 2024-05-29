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