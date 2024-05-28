import asyncio
import websockets
import json, math, random, copy

level = [
    [0, 0, 0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 0, 1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
]

players = []
RADII = 40
MAP_WALL_GEOMETERY = RADII * 2


class Box:
    def __init__(self, x, y, width, height):
        self.x = x
        self.y = y
        self.width = width
        self.height = height


boxes = []
for i, row in enumerate(level):
    for j, element in enumerate(row):
        if element == 1:
            boxes.append(
                Box(
                    j * MAP_WALL_GEOMETERY,
                    i * MAP_WALL_GEOMETERY,
                    MAP_WALL_GEOMETERY,
                    MAP_WALL_GEOMETERY,
                )
            )


def clamp(value, mini, maxi):
    return max(mini, min(value, maxi))


def players_colliding(player1, player2):
    try:
        if (
            player1["x"] is None
            or player1["y"] is None
            or player2["x"] is None
            or player2["y"] is None
        ):
            return False

        distance_squared = (player1["x"] - player2["x"]) ** 2 + (
            player1["y"] - player2["y"]
        ) ** 2
    except Exception as e:
        print(e)
        return False
    return distance_squared <= (2 * RADII) ** 2


def distance(x1, y1, x2, y2):
    return math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)


def handle_collision(player1, player2):
    dist = distance(player1["x"], player1["y"], player2["x"], player2["y"])
    overlap = 2 * RADII - dist
    dir_x = player2["x"] - player1["x"]
    dir_y = player2["y"] - player1["y"]
    length = math.sqrt(dir_x**2 + dir_y**2)
    if length != 0:
        dir_x /= length
        dir_y /= length
    move_x = overlap * dir_x / 2
    move_y = overlap * dir_y / 2
    player1["x"] -= move_x
    player1["y"] -= move_y
    player2["x"] += move_x
    player2["y"] += move_y
    restitution = 0.8
    relative_velocity_x = player2["xvel"] - player1["xvel"]
    relative_velocity_y = player2["yvel"] - player1["yvel"]
    impulse = (relative_velocity_x * dir_x + relative_velocity_y * dir_y) * restitution
    player1["xvel"] += impulse * dir_x
    player1["yvel"] += impulse * dir_y
    player2["xvel"] -= impulse * dir_x
    player2["yvel"] -= impulse * dir_y
    player1["xvel"] *= 0.85
    player1["yvel"] *= 0.85
    player2["xvel"] *= 0.85
    player2["yvel"] *= 0.85


def clamp(value, min_value, max_value):
    return max(min_value, min(value, max_value))


def handle_map_collision(player):
    for box in boxes:
        closestX = clamp(player["x"], box.x, box.x + box.width)
        closestY = clamp(player["y"], box.y, box.y + box.height)

        distanceX = player["x"] - closestX
        distanceY = player["y"] - closestY
        distanceSquared = (distanceX * distanceX) + (distanceY * distanceY)

        if distanceSquared <= RADII**2:
            distance = math.sqrt(distanceSquared)
            if distance != 0:
                displacementX = distanceX / distance
                displacementY = distanceY / distance
                player["x"] += displacementX * (RADII - distance)
                player["y"] += displacementY * (RADII - distance)


def collison():
    for i, player in enumerate(players):
        if player["x"] is None or player["y"] is None:
            return False
        player["xvel"] *= 0.9
        player["yvel"] *= 0.9
        player["x"] = player["x"] + player["xvel"]
        player["y"] = player["y"] + player["yvel"]
        handle_map_collision(player)
        for j, other_player in enumerate(players):
            if i == j:
                continue
            try:
                if players_colliding(player, other_player):
                    handle_collision(player, other_player)
            except Exception as e:
                print(e)


async def handler(websocket, path):
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
            except Exception as e:
                print(e)

            collison()

            # Kicks "fake" players that could be created by spamming requests
            try:
                player_uuid = data["uuid"]
                for player in players:
                    if player["uuid"] != player_uuid:
                        player["lastRequest"] = player["lastRequest"] + 1
                        if player["lastRequest"] > 500:
                            players.remove(player)
                    else:
                        player["lastRequest"] = 0
                        
            except Exception:
                None

            if data["type"] == "__ping__":
                await websocket.send(json.dumps({"type": "__pong__"}))

            elif data["type"] == "move":
                player_uuid = data["uuid"]
                player_exists = False
                for player in players:
                    if player["uuid"] == player_uuid:
                        player["xvel"] = data["xvel"]
                        player["yvel"] = data["yvel"]
                        player_exists = True
                        break

                if not player_exists:
                    players.append(
                        {
                            "uuid": player_uuid,
                            "x": random.randint(10, 1000),
                            "y": random.randint(10, 1000),
                            "xvel": data["xvel"],
                            "yvel": data["yvel"],
                            "lastRequest" : 0
                        }
                    )

                await websocket.send(json.dumps({"status": "Success"}))

            elif data["type"] == "data":
                player_uuid = data.get("uuid")
                if player_uuid:
                    copy_of_players = copy.deepcopy(players)

                    for player in copy_of_players:
                        del player["xvel"], player["yvel"], player["lastRequest"]
                        player["x"] = round(player["x"], 3)
                        player["y"] = round(player["y"], 3)
                        if player["uuid"] != player_uuid:
                            player["uuid"] = 0

                    if copy_of_players:
                        await websocket.send(
                            json.dumps(
                                {"type": "playerData", "players": copy_of_players}
                            )
                        )
                    else:
                        await websocket.send(
                            json.dumps({"status": "No players available"})
                        )
                else:
                    await websocket.send(json.dumps({"status": "Invalid request"}))

            elif data["type"] == "disconnect":
                player_uuid = data["uuid"]
                for player in players:
                    if player["uuid"] == player_uuid:
                        players.remove(player)
                        break

            elif data["type"] == "xy":
                player_uuid = data["uuid"]
                for player in players:
                    if player["uuid"] == player_uuid:
                        player["x"] = data["x"]
                        player["y"] = data["y"]

            elif data["type"] == "getLevel":
                await websocket.send(json.dumps({"type": "levelData", "level": level}))

    except Exception as e:
        print(e)


start_server = websockets.serve(handler, "0.0.0.0", 8000)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
