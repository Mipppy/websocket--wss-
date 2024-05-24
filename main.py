import asyncio
import websockets
import json
players = []

async def handler(websocket, path):
    data = await websocket.recv()
    try:
        json.loads(data)
        if data["type"] == "coord":
            players.append({data["x"], data["y"]})
            await websocket.send("Success")
        if data["type"] == "data":
            await websocket.send(players)
    except Exception:
        None
    
start_server = websockets.serve(handler, "0.0.0.0", 8000)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()