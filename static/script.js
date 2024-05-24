var socket = new WebSocket("wss://websocket-wss.onrender.com");

socket.onopen = function(event) {
    console.log("WebSocket is open now.");

    var message1 = JSON.stringify({type: 'coord', x: 10, y: 30});
    socket.send(message1);
    console.log("Sent: ", message1);

    var message2 = JSON.stringify({type: 'data'});
    socket.send(message2);
    console.log("Sent: ", message2);
};

socket.onmessage = function(event) {
    console.log("Received: ", event.data);
};

socket.onerror = function(error) {
    console.error("WebSocket error observed:", error);
};

socket.onclose = function(event) {
    console.log("WebSocket is closed now.");
};
