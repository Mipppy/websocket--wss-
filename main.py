import math
import asyncio, random, websockets, struct, copy

def compress_2d_list(data):
    compressed_data = bytearray()
    for row in data:
        compressed_row = int(''.join(map(str, row)), 2).to_bytes((len(row) + 7) // 8, byteorder='big')
        compressed_data += compressed_row
    return compressed_data

# CONSTRAINTS:  LENGTH MUST BE A POWER OF 2 & ALL ROWS MUST BE EQUAL LENGTH
level = [
    [0, 0, 0, 0, 0, 1, 0, 0],
    [0, 0, 0, 0, 1, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0],
    [1, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
]

players = []
RADII = 40
MAP_WALL_GEOMETRY = RADII * 2
SPEED = 3.0
DIAGONAL_SPEED_PENALTY = 0.90
LIGHT_RANGE = 700

class Box:
    def __init__(self, x, y, width, height):
        self.x = x
        self.y = y
        self.width = width
        self.height = height


boxes = [Box(j * MAP_WALL_GEOMETRY, i * MAP_WALL_GEOMETRY,MAP_WALL_GEOMETRY,MAP_WALL_GEOMETRY,) for i, row in enumerate(level) for j, element in enumerate(row) if element == 1]

connected_sockets = dict()

async def handler(websocket, path):
    try:
        async for message in websocket:
            await handleBinary(message, websocket)
    except Exception as e:
        print(f"Error: {e}")

def compress_2d_list(data):
    compressed_data = bytearray()
    
    compressed_data.append(7)
    
    num_bits_per_row = len(data[0])
    
    compressed_data.append(num_bits_per_row)
    
    # Compress each row
    for row in data:
        compressed_row = int(''.join(map(str, row)), 2).to_bytes((len(row) + 7) // 8, byteorder='big')
        compressed_data += compressed_row
    
    return compressed_data

players = [] 


async def handleKeypresses(first_byte, uuid_bytes, angle, flash, *args, **kwargs):
    try:
        keypress = (first_byte & 0xF0) >> 4
        flashLight = (first_byte >> 3) & 0x01
        binary_keypress = bin(keypress)[2:].zfill(4)
        player_exists = False
        for player in players:
            if player["uuid"] == uuid_bytes:
                player["w"] = binary_keypress[3] == "1"
                player["a"] = binary_keypress[2] == "1"
                player["s"] = binary_keypress[1] == "1"
                player["d"] = binary_keypress[0] == "1"
                player["angle"] = angle
                player["flashLightStatus"] = flashLight == 1
                player_exists = True
                break

        if not player_exists:
            players.append({"uuid": uuid_bytes,"x": random.randint(10, 1000),"y": random.randint(10, 1000),"lastRequest": 0,"w": False,"a": False,"s": False,"d": False,"xvel": 0,"yvel": 0, "angle": 0, "flashLightStatus": False})
    except Exception as e:
        print(f"Error in handleKeypresses: {e}")


def playerXYOverflowHandler():
    for player in players:
        if player["x"] > 65535:
            player["x"] = 0
        if player["x"] < 0:
            player["x"] = 65535
        if player["y"] > 65535:
            player["y"] = 0
        if player["y"] < 0:
            player["y"] = 65535


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



def compressPlayerData(uuid_bytes, players):
    data = bytearray()
    num_players = len(players)
    data.extend(struct.pack("!B", 15))
    data.extend(struct.pack("!B", num_players))

    player_with_uuid = None
    other_players = []

    for player in players:
        if player["uuid"] == uuid_bytes:
            player_with_uuid = player
        else:
            other_players.append(player)

    for player in other_players:
        data.extend(struct.pack("!H", round(player["x"])))
        data.extend(struct.pack("!H", round(player["y"])))
        data.extend(struct.pack("!B", player["angle"]))
        data.extend(struct.pack("!B", player["flashLightStatus"]))

    if player_with_uuid:
        data.extend(struct.pack("!H", round(player_with_uuid["x"])))
        data.extend(struct.pack("!H", round(player_with_uuid["y"])))
        data.extend(struct.pack("!B", player_with_uuid["angle"]))
        data.extend(struct.pack("!B", player_with_uuid["flashLightStatus"]))

    data.extend(uuid_bytes)
    return data.decode("latin-1")

async def handleGetData(*args, **kwargs):
    try:
        player_uuid = args[0][1:5]
        connected_sockets[player_uuid] = args[1]
        handleAFKDisconnects(player_uuid)
        await handleKeypresses(args[0][0], player_uuid ,args[0][5], args[0][6])
    except Exception as e:
        print(f"Error in handleGetData: {e}")

def handleAFKDisconnects(uuid):
    for player in players:
        if player["uuid"] != uuid:
            player["lastRequest"] = player["lastRequest"] + 1
            if player["lastRequest"] > 500:
                connected_sockets.pop(player["uuid"])
                players.remove(player)
        else:
            player["lastRequest"] = 0

def handleDisconnect(*args, **kwargs):
    player_uuid = args[0][1:5]
    for player in players:
        if player["uuid"] == player_uuid:
            connected_sockets.pop(player_uuid)
            players.remove(player)
            break

async def handleLevelDataRequest(*args, **kwargs):
    compressedLevelData = compress_2d_list(level)
    await args[1].send(compressedLevelData.decode("latin-1"))
    
mappings = {3: handleGetData, 1: handleDisconnect, 7: handleLevelDataRequest}


async def handleBinary(data, websocket):
    try:
        data_type = data[0] & 0x07
        if data_type in mappings:
            await mappings[data_type](data, websocket)
    except Exception:
        None


async def periodic_update():
    while True:
        try:
            await asyncio.sleep(0.0333)
            collison()
            updatePlayerVelocities()
            await sendPlayerData()
        except Exception as e:
            print(f"Error in periodic_update: {e}")

async def sendPlayerData():
    for key, value in connected_sockets.items():
        player_with_uuid = next((player for player in players if player["uuid"] == key), None)
        if not player_with_uuid:
            continue

        copy_of_players = copy.deepcopy(players)
        for player in copy_of_players:
            del player["lastRequest"], player["w"], player["a"], player["s"], player["d"], player["xvel"], player["yvel"]
            
            if player["uuid"] != key:
                # No need to give player data if the player is far away
                dis = distance(player_with_uuid["x"], player_with_uuid["y"], player["x"], player["y"])
                if dis >= 1500:
                    copy_of_players.remove(player)
                # No need to give player data if the player if further than flashlight range and their light is off
                elif dis >= LIGHT_RANGE and player["flashLightStatus"] == 0:
                    copy_of_players.remove(player)
                else:
                    player["x"] = round(player["x"], 1)
                    player["y"] = round(player["y"], 1)
            else:
                player["x"] = round(player["x"], 1)
                player["y"] = round(player["y"], 1)

        compressed_data = compressPlayerData(key, copy_of_players)
        if compressed_data:
            await value.send(compressed_data)


key_actions = {
    "a": lambda player: player.update({"xvel": player["xvel"] - SPEED}),
    "d": lambda player: player.update({"xvel": player["xvel"] + SPEED}),
    "w": lambda player: player.update({"yvel": player["yvel"] - SPEED}),
    "s": lambda player: player.update({"yvel": player["yvel"] + SPEED}),
}


def apply_traction(player):
    if (player.get("w", False) or player.get("s", False)) and (player.get("a", False) or player.get("d", False)):
        player["xvel"] *= DIAGONAL_SPEED_PENALTY
        player["yvel"] *= DIAGONAL_SPEED_PENALTY

    player["xvel"] *= 0.8
    player["yvel"] *= 0.8
    if abs(player["xvel"]) < 0.01:
        player["xvel"] = 0
    if abs(player["yvel"]) < 0.01:
        player["yvel"] = 0
    player["x"] += player["xvel"]
    player["y"] += player["yvel"]
    player["x"] = round(player["x"], 2)
    player["y"] = round(player["y"], 2)
    playerXYOverflowHandler()


def updatePlayerVelocities():
    for player in players:
        for key, action in key_actions.items():
            if player.get(key, False):
                action(player)
        apply_traction(player)


async def start_server():
    async with websockets.serve(handler, "0.0.0.0", 8000):
        await asyncio.Future()


async def main():
    await asyncio.gather(start_server(), periodic_update())


if __name__ == "__main__":
    asyncio.run(main())
