import eventlet
eventlet.monkey_patch()
import xml.etree.ElementTree as ET
import random
import uuid
from flask import Flask, jsonify, request, render_template, session
import socketio
from datetime import datetime
from game_logic import validate_placement, extract_words_from_board
import os
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DICT_PATH = os.path.join(BASE_DIR, "dictionary.xml")
WORDS_PATH = "/etc/secrets/messages.txt"
print("Current working dir:", os.getcwd())
print("Files here:", os.listdir())
print("Dict path:", DICT_PATH)
games = {}
rooms = {}
players = {}
placed_tiles = []
LETTER_TO_BONUS = {
    "N" : None,
    "S" : None,
    "L" : "2L",
    "R" : "2L",
    "D" : "2L",
    "O" : "3L",
    "I" : "4L",
    "X" : "4L",
    "B" : "2W",
    "Y" : "2W",
    "G" : "3W",
    "P" : "4W"
}

BOARD17_17 = [
    ["P", "N", "N", "N", "R", "N", "N", "N", "G", "N", "N", "N", "R", "N", "N", "N", "P"],
    ["N", "N", "N", "O", "N", "N", "N", "L", "N", "R", "N", "N", "N", "O", "N", "N", "N"],
    ["N", "N", "B", "N", "N", "N", "O", "N", "N", "N", "O", "N", "N", "N", "B", "N", "N"],
    ["N", "O", "N", "X", "N", "B", "N", "N", "X", "N", "N", "B", "N", "X", "N", "O", "N"],
    ["R", "N", "N", "N", "I", "N", "N", "N", "N", "N", "N", "N", "I", "N", "N", "N", "R"],
    ["N", "N", "N", "B", "N", "X", "N", "N", "L", "N", "N", "X", "N", "B", "N", "N", "N"],
    ["N", "N", "O", "N", "N", "N", "N", "D", "N", "D", "N", "N", "N", "N", "O", "N", "N"],
    ["N", "L", "N", "N", "N", "N", "L", "N", "N", "N", "L", "N", "N", "N", "N", "L", "N"],
    ["G", "N", "N", "X", "N", "Y", "N", "N", "S", "N", "N", "Y", "N", "X", "N", "N", "G"],
    ["N", "L", "N", "N", "N", "N", "L", "N", "N", "N", "L", "N", "N", "N", "N", "L", "N"],
    ["N", "N", "O", "N", "N", "N", "N", "D", "N", "D", "N", "N", "N", "N", "O", "N", "N"],
    ["N", "N", "N", "B", "N", "X", "N", "N", "L", "N", "N", "X", "N", "B", "N", "N", "N"],
    ["R", "N", "N", "N", "I", "N", "N", "N", "N", "N", "N", "N", "I", "N", "N", "N", "R"],
    ["N", "O", "N", "X", "N", "B", "N", "N", "X", "N", "N", "B", "N", "X", "N", "O", "N"],
    ["N", "N", "B", "N", "N", "N", "O", "N", "N", "N", "O", "N", "N", "N", "B", "N", "N"],
    ["N", "N", "N", "O", "N", "N", "N", "L", "N", "R", "N", "N", "N", "O", "N", "N", "N"],
    ["P", "N", "N", "N", "R", "N", "N", "N", "G", "N", "N", "N", "R", "N", "N", "N", "P"]
]
def load_dictionary() -> dict:
    '''Loads a swedish-english dictionary'''
    sw_dictionary = {}
    tree = ET.parse(DICT_PATH)
    root = tree.getroot()
    for word in root.findall("word"):
        value = word.get("value").upper()
        word_class = "okänt" if word.get("class") is None else word.get("class")
        comment =  "okänt" if word.get("comment") is None else word.get("comment")
        lang = "okänt" if  word.get("lang") is None else  word.get("lang")
        translation_el = word.find("translation")
        translation = translation_el.get("value") if translation_el is not None else "okänt"
        if value in sw_dictionary:
            sw_dictionary[value].append({"class" : word_class, "comment" : comment,
                "language" : lang, "translation" : translation})
        else:
            sw_dictionary[value] = [{"class" : word_class, "comment" : comment,
                "language" : lang, "translation" : translation}]
        inflection_cont = word.find("paradigm")
        if inflection_cont is not None:
            inflections = inflection_cont.findall("inflection")
            for inflection in inflections:
                value = inflection.get("value").upper()
                if value in sw_dictionary:
                    sw_dictionary[value].append({"class" : word_class, "comment" : comment,
                        "language" : lang, "translation" : translation})
                else:
                    sw_dictionary[value] = [{"class" : word_class, "comment" : comment,
                        "language" : lang, "translation" : translation}]
    with open(WORDS_PATH, encoding="utf-8") as f:
        for line in f:
            if line.strip():
                sw_dictionary[line.strip()] = {"class" : "unknown", "comment" : "unknown",
                        "language" : "unknown", "translation" : "unknown"}
    return sw_dictionary

def get_brickbag():
    """Generates and returns a bag of bricks
    Returns:
        brick_bag : list of dicts with id : int, letter : str and value : int"""
    bricks = {
        "D": {"Value": 1, "Number": 7},
        "O": {"Value": 2, "Number": 5},
        "R": {"Value": 1, "Number": 9},
        "Ä": {"Value": 4, "Number": 2},
        "S": {"Value": 1, "Number": 8},
        "Å": {"Value": 4, "Number": 2},
        "E": {"Value": 1, "Number": 8},
        "T": {"Value": 1, "Number": 7},
        #"Blank": {"Value": 0, "Number": 2},
        "L": {"Value": 1, "Number": 7},
        "A": {"Value": 1, "Number": 9},
        "F": {"Value": 4, "Number": 2},
        "Ö": {"Value": 4, "Number": 2},
        "I": {"Value": 1, "Number": 6},
        "N": {"Value": 1, "Number": 7},
        "Y": {"Value": 8, "Number": 2},
        "H": {"Value": 3, "Number": 3},
        "M": {"Value": 3, "Number": 3},
        "G": {"Value": 2, "Number": 4},
        "B": {"Value": 4, "Number": 2},
        "K": {"Value": 3, "Number": 3},
        "C": {"Value": 8, "Number": 2},
        "X": {"Value": 10, "Number": 1},
        "P": {"Value": 3, "Number": 3},
        "V": {"Value": 4, "Number": 2},
        "Z": {"Value": 10, "Number": 1},
        "J": {"Value": 8, "Number": 1},
        "U": {"Value": 3, "Number": 3},
        "Q": {"Value": 10, "Number": 1},
        #"Black": {"Value": 0, "Number": 2},
        #"DownRightArrow": {"Value": 0, "Number": 2},
        #"UpRightArrow": {"Value": 0, "Number": 2},
    }
    brick_id = 0
    brickBag = []
    for  key, value in bricks.items():
        for i in range(value["Number"]):
            brickBag.append({"id": f"Brick{brick_id}", "letter" : key, "value": value["Value"]})
            brick_id += 1
    random.shuffle(brickBag)
    return brickBag

def draw(old_bricks, game_id, player_index):
    """Draws nr_bricks bricks from the bag of game_id
    Args:
        old_bricks: array of old bricks : [{'id' : int}]
        game_id: int
    Returns:
        array of dicts"""
    game_state = games[game_id]
    brick_bag = game_state['brick_bag']
    old_hand = game_state['players'][player_index]['hand']
    ids = []
    for brick in old_bricks:
        ids.append(brick['id'])
    old_hand = [brick for brick in old_hand if brick['id'] not in ids]
    pop_len = 0
    if len(brick_bag) >= len(old_bricks):
        pop_len = len(old_bricks)
    elif len(brick_bag) > 0:
        pop_len = len(brick_bag)
    hand = []
    if pop_len > 0:
        hand = [brick_bag.pop() for _ in range(pop_len)]
    new_hand = old_hand + hand
    game_state['players'][player_index]['hand'] = new_hand
    games[game_id] = game_state
    return new_hand

def create_game(player_name, sid):
    """Create a new game instance"""
    game_id = str(uuid.uuid4())[:8]
    brick_bag = get_brickbag()
    
    # Draw initial hand for first player
    hand = [brick_bag.pop() for _ in range(8)]
    
    game_state = {
        'game_id': game_id,
        'players': [{
            'id': sid,
            'name': player_name,
            'hand': hand,
            'score': 0
        }],
        'current_player': sid,
        'turn' : 0,
        'brick_bag': brick_bag,
        'board' : BOARD17_17,
        'brick_positions' : [[None for _ in range(17)] for _ in range(17)],
        'game_started': False,
        'game_over': False,
        'first_move' : True,
        'created_at': datetime.now().isoformat(),
        'end_turn' : -1
    }
    players[sid] = player_name
    games[game_id] = game_state
    rooms[sid] = game_id
    return game_state

def join_game(player_name, game_id, sid):
    """Join a game with id game_id"""
    if game_id not in games:
        return None
    game_state = games[game_id]
    brick_bag = game_state['brick_bag']
    hand = [brick_bag.pop() for _ in range(8)]
    game_state["players"].append({
        'id':sid,
        'name':player_name,
        'hand': hand,
        'score' : 0
    })
    players[sid] = player_name
    games[game_id] = game_state
    rooms[sid] = game_id
    return game_state

def next_turn(game_id, passing_turn):
    """Changes turn to next player"""
    if game_id not in games:
        return None
    game_state = games[game_id]
    if not passing_turn:
        game_state['first_move'] = False
    game_state['turn'] += 1
    player_index = game_state['turn'] % len(game_state['players'])
    player_id = game_state['players'][player_index]['id']
    game_state['current_player'] = player_id
    player_name = game_state['players'][player_index]['name']
    print(player_name + "s runda!")
    games[game_id] = game_state
    return game_state


def update_board(tiles_played, game_id):
    """Updates the board with the new tiles played"""
    if game_id not in games:
        return None
    game_state = games[game_id]
    for tile in tiles_played:
        game_state['brick_positions'][tile['row']][tile['col']] = tile
    games[game_id] = game_state
    return game_state

def calculate_word_score(tiles_played, board=BOARD17_17):
    """Calculates the score for a word and bonuses
    Args:
        tiles_played = array of tile positions and values [{col:int, row:int, value:int}]
    Returns:
        score:int
    """
    word_multiplier = 1
    score = 0
    for tile in tiles_played:
        tile_value = int(tile['value'])
        board_tile = board[tile['row']][tile['col']]
        if LETTER_TO_BONUS[board_tile] is not None:
            match LETTER_TO_BONUS[board_tile]:
                case "2L":
                    tile_value *= 2
                case "3L":
                    tile_value *= 3
                case "4L":
                    tile_value *= 4
                case "2W":
                    word_multiplier *= 2
                case "3W":
                    word_multiplier *= 3
                case "4W":
                    word_multiplier *= 4
        score += tile_value
    score *= word_multiplier
    return score

def update_tiles(new_tiles):
    """Updates placed tiles with new ones"""
    placed_tiles.extend(new_tiles)
    return placed_tiles

sio = socketio.Server(cors_allowed_origins="*")
app = Flask(__name__)
app.wsgi_app = socketio.WSGIApp(sio, app.wsgi_app)
@app.route('/')
def index():
    return render_template("index.html")

@sio.event
def create(sid, data):
    '''Creates a new game'''
    game = create_game(player_name=data["player_name"], sid=sid)
    player_id = game['players'][0]['id']
    sio.enter_room(sid, game["game_id"])
    return {"ok" : True, "gameId" : game["game_id"], "playerId":player_id}

@sio.event
def join(sid, data):
    """Joins a game"""
    game = join_game(player_name=data["player_name"], game_id=data["join_id"], sid=sid)
    if game:
        sio.enter_room(sid, game["game_id"])
        player_id = game['players'][-1]['id']
        return {"ok" : True, "gameId" : game["game_id"], "playerId" : player_id}
    return {"ok" : False}

@sio.event
def start(sid):
    """Starts a a game"""
    if sid in rooms:
        game = games[rooms[sid]]
        if not game["game_started"]:
            for player in game['players']:
                sio.emit(
                    "start",
                    {"board" : game["board"], "brickPositions" : game["brick_positions"], "hand" : player["hand"],
                     "currentPlayerName" : players[game['current_player']], "currentPlayerID" : game['current_player']},
                    to=player['id']
                )
            return {"ok" : True}
        else:
            return {"ok" : False}
    else:
        return {"ok" : False}

@sio.event
def pass_turn(sid, data):
    if sid in rooms:
        game_id = rooms[sid]
        game = games[game_id]
        if sid != game['current_player']:
            return {"ok" : True, "valid" : False, "reason" : f"{players[game['current_player']]} tur! Vänta innan du spelar."}
        selected_tiles = data["selectedTiles"]
        player_index = game['turn'] % len(game['players'])
        
        hand = draw(old_bricks=selected_tiles, game_id=game_id, player_index=player_index)
        print(hand)
        game = next_turn(game_id, True)
        scores = []
        for player in game['players']:
            scores.append((player['score'], player['name']))
        scores.sort(reverse=True)
        if game['end_turn'] == game['turn']:
            sio.emit(
                "game_end", {
                    'scoreBoard' : scores
                }
            )
            return {"ok" : True, "valid" : True, "hand" : hand}
        sio.emit(
            "update",
            {
                'currentPlayerID' : game['current_player'],
                'currentPlayerName' : players[game['current_player']],
                'brickPositions' : game['brick_positions'],
                'placedBricks' : update_tiles(selected_tiles),
                'scoreBoard' : scores
            }, room=rooms[sid]
        )
        return {"ok" : True, "valid" : True, "hand" : hand, "msg": f"Gav upp {len(selected_tiles)} brickor för nya",}
    else:
        return {"ok" : False}
    
@sio.event
def play_word(sid, data):
    if sid in rooms:
        game_id = rooms[sid]
        game = games[game_id]
        if sid != game['current_player']:
            return {"ok" : True, "valid" : False, "reason" : f"{players[game['current_player']]} tur! Vänta innan du spelar."}
        selected_tiles = data["selectedTiles"]
        for tile in selected_tiles:
            tile['col'] = int(tile['col'])
            tile['row'] = int(tile['row'])
        result = validate_placement(selected_tiles, game["brick_positions"], game["first_move"])
        print(result)
        if result["valid"]:
            main_word, extracted_words = extract_words_from_board(selected_tiles, game['brick_positions'])
            for extracted_word in extracted_words:
                word = extracted_word['word']
                if word in dictionary:
                    print(dictionary[word])
                else:
                    return {"ok" : True, "valid" : False, "reason" : f"{word} är inte ett svenskt ord."}
            game_state = update_board(tiles_played=selected_tiles, game_id=game_id)
            
            score = 0
            for word in extracted_words:
                played_tiles = word['tiles']
                word_played  = word['word']
                score += calculate_word_score(played_tiles)
                print(f"Spelade {word_played} för {calculate_word_score(played_tiles)} poäng")
            player_index = game_state['turn'] % len(game_state['players'])
            game_state['players'][player_index]['score'] += score
            games[game_id] = game_state
            hand = draw(old_bricks=selected_tiles, game_id=game_id, player_index=player_index)
            game = games[game_id]
            scores = []
            for player in game_state['players']:
                scores.append((player['score'], player['name']))
            scores.sort(reverse=True)
            print(len(game['brick_bag']))
            if game['end_turn'] < 0 and len(game['brick_bag']) == 0:
                game['end_turn'] = game['turn'] + len(game['players'])
                games[game_id] = game
            if game['end_turn'] == game['turn']:
                sio.emit(
                    "game_end", {
                        'scoreBoard' : scores
                    }
                )
                return {"ok" : True, "valid" : True, "score" : score, "msg": f"Spelade {main_word} för {score} poäng", "hand" : hand}
            game_state = next_turn(game_id, False)
            
            sio.emit(
                "update",
                {
                    'currentPlayerID' : game_state['current_player'],
                    'currentPlayerName' : players[game_state['current_player']],
                    'brickPositions' : game_state['brick_positions'],
                    'placedBricks' : update_tiles(selected_tiles),
                    'scoreBoard' : scores
                }, room=rooms[sid]
            )
            return {"ok" : True, "valid" : True, "score" : score, "msg": f"Spelade {main_word} för {score} poäng", "hand" : hand}
        else:
            return {"ok" : True, "valid" : False, "reason" : result['reason']}

        
    else:
        return {"ok" : False}
dictionary = {}
@sio.event
def connect(sid, environ):
    print("Connected:", sid)

if __name__ == '__main__':
    # Load dictionary on startup
    print("Loading Swedish dictionary...")
    try:
        dictionary = load_dictionary()
        print(f"Dictionary loaded: {len(dictionary)} words")
    except Exception as e:
        print(f"Warning: Could not load dictionary: {e}")
        dictionary = {}    
    eventlet.wsgi.server(eventlet.listen(("0.0.0.0", 5000)), app)