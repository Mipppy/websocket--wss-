import asyncio
import websockets
import json

players = []

async def handler(websocket, path):
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
            except Exception:
                None
            
            try:
                if data["type"] == "__ping__":
                    await websocket.send(json.dumps({"type": "__pong__"}))
                
                elif data["type"] == "coord":
                    player_uuid = data["uuid"]
                    player_exists = False
                    for player in players:
                        if player["uuid"] == player_uuid:
                            player["x"] = data["x"]
                            player["y"] = data["y"]
                            player_exists = True
                            break
                    
                    if not player_exists:
                        players.append({"uuid": player_uuid, "x": data["x"], "y": data["y"]})
                        
                    await websocket.send(json.dumps({"status": "Success"}))
                
                elif data["type"] == "data":
                    player_data = [{"x": player["x"], "y": player["y"]} for player in players]
                    if player_data:
                        await websocket.send(json.dumps({"type": "playerData", "players": player_data}))
                    else:
                        await websocket.send(json.dumps({"status": "No players available"}))
                            
                elif data["type"] == "disconnect":
                    print("disconnect")
                    player_uuid = data["uuid"]
                    for player in players:
                        if player["uuid"] == player_uuid:
                            players.remove(player)
                            break
            except Exception:
                None
        
    except Exception as e:
        await websocket.send(json.dumps({"status": "Error", "message": str(e)}))

start_server = websockets.serve(handler, "localhost", 8000)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
