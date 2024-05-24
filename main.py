import asyncio
import websockets
import json

players = []

async def handler(websocket, path):
    try:
        async for message in websocket:
            data = json.loads(message)
            
            if data["type"] == "coord":
                players.append({"x": data["x"], "y": data["y"]})
                await websocket.send(json.dumps({"status": "Success"}))
            
            elif data["type"] == "data":
                if players:
                    await websocket.send(json.dumps({"status": "Success", "players": players}))
                else:
                    await websocket.send(json.dumps({"status": "No players available"}))
        
    except Exception as e:
        await websocket.send(json.dumps({"status": "Error", "message": str(e)}))

start_server = websockets.serve(handler, "0.0.0.0", 8000)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
