import xml.etree.ElementTree as ET
import random
import uuid
from flask import Flask, jsonify, request, render_template, session
from datetime import datetime
from game_logic import validate_placement, extract_words_from_board
games = {}
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
    tree = ET.parse("dictionary.xml")
    root = tree.getroot()
    for word in root.findall("word"):
        value = word.get("value").lower()
        word_class = word.get("class")
        comment = word.get("comment")
        lang = word.get("lang")
        translation_el = word.find("translation")
        translation = translation_el.get("value") if translation_el is not None else ""
        sw_dictionary[value] = {"class" : word_class, "comment" : comment,
            "language" : lang, "translation" : translation}
        if(word_class == "vb"):
            inflection_cont = word.find("paradigm")
            if inflection_cont is not None:
                inflections = inflection_cont.findall("inflection")
                for inflection in inflections:
                    sw_dictionary[inflection.get("value")] = {"class" : word_class, "comment" : comment,
                "language" : lang, "translation" : translation}
    return sw_dictionary

def get_brickbag():
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

    brickBag = []
    for  key, value in bricks.items():
        for i in range(value["Number"]):
            brickBag.append([key, value["Value"]])
    random.shuffle(brickBag)
    return brickBag

def create_game(player_name):
    """Create a new game instance"""
    game_id = str(uuid.uuid4())[:8]
    brick_bag = get_brickbag()
    
    # Draw initial hand for first player
    hand = [brick_bag.pop() for _ in range(7)]
    
    game_state = {
        'game_id': game_id,
        'players': [{
            'id': str(uuid.uuid4())[:8],
            'name': player_name,
            'hand': hand,
            'score': 0
        }],
        'current_player': 0,
        'brick_bag': brick_bag,
        'board' : BOARD17_17,
        'brick_positions' : [[None for _ in range(17)] for _ in range(17)],
        'game_started': False,
        'game_over': False,
        'created_at': datetime.now().isoformat()
    }
    games[game_id] = game_state
    return game_state

def join_game(game_id, player_name):
    """Adds a player to an existing game"""
    if game_id not in games:
        return None
    
    game = games[game_id]
    
    # Check if game already started or full
    if game['game_started']:
        return {'error': 'Game already started'}
    if len(game['players']) >= 4:  # Max 4 players
        return {'error': 'Game is full'}
    
    # Draw hand for new player
    hand = [game['brick_bag'].pop() for _ in range(7)]
    
    player = {
        'id': str(uuid.uuid4())[:8],
        'name': player_name,
        'hand': hand,
        'score': 0
    }
    
    game['players'].append(player)
    return game

def start_game(game_id):
    """Mark game as started"""
    if game_id not in games:
        return None
    
    game = games[game_id]
    if len(game['players']) < 2:
        return {'error': 'Need at least 2 players'}
    
    game['game_started'] = True
    return game

def validate_word(word, dictionary):
    """Check if word exists in dictionary"""
    return word.lower() in dictionary

def caluclate_word_score(tiles_played, board=BOARD17_17):
    """Calculates the score for a word and bonuses
    Args:
        tiles_played = array of tile positions and values [((1, 3), 4)]
    """
    word_multiplier = 1
    score = 0
    for tile in tiles_played:
        tile_position = tile[0]
        tile_value = tile[1]
        board_tile = board[tile_position[0]][tile_position[1]]
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


app = Flask(__name__)
@app.route('/')
def index():
    return render_template("index.html")
@app.route('/api/game/create', methods=['POST'])
def api_create_game():
    """Create a new game"""
    data = request.json
    print(request.json)
    player_name = data.get('player_name', 'Player 1')
    
    game = create_game(player_name)
    player_id = game['players'][0]['id']
    
    return jsonify({
        'game_id': game['game_id'],
        'player_id': player_id,
        'status': 'waiting_for_players'
    })

@app.route('/api/game/<game_id>/join', methods=['POST'])
def api_join_game(game_id):
    """Join an existing game"""
    data = request.json
    player_name = data.get('player_name', f'Player {len(games.get(game_id, {}).get("players", [])) + 1}')
    
    result = join_game(game_id, player_name)
    
    if result is None:
        return jsonify({'error': 'Game not found'}), 404
    if 'error' in result:
        return jsonify(result), 400
    
    player_id = result['players'][-1]['id']
    return jsonify({
        'game_id': game_id,
        'player_id': player_id,
        'status': 'joined'
    })

@app.route('/api/game/<game_id>/start', methods=['POST'])
def api_start_game(game_id):
    """Start the game"""
    result = start_game(game_id)
    
    if result is None:
        return jsonify({'error': 'Game not found'}), 404
    if 'error' in result:
        return jsonify(result), 400
    
    return jsonify({'status': 'game_started'})

@app.route('/api/game/<game_id>/state', methods=['GET'])
def api_game_state(game_id):
    """Get current game state"""
    player_id = request.args.get('player_id')
    
    if game_id not in games:
        return jsonify({'error': 'Game not found'}), 404
    
    game = games[game_id]
    
    # Create a safe copy that only shows current player's hand
    safe_state = {
        'game_id': game['game_id'],
        'players': [],
        'current_player': game['current_player'],
        'board': game['board'],
        "brick_positions" : game["brick_positions"],
        'game_started': game['game_started'],
        'game_over': game['game_over'],
        'tiles_remaining': len(game['brick_bag'])
    }
    
    # Add player info, but only show hand for requesting player
    for player in game['players']:
        player_info = {
            'id': player['id'],
            'name': player['name'],
            'score': player['score'],
            'tiles_count': len(player['hand'])
        }
        if player['id'] == player_id:
            player_info['hand'] = player['hand']
        safe_state['players'].append(player_info)
    
    return jsonify(safe_state)
@app.route('/api/game/<game_id>/play', methods=['POST'])
def api_play_word(game_id):
    """Submit a word/move"""
    data = request.json
    player_id = data.get('player_id')
    tiles_played = data.get('tiles')  # [{row, col, letter, value}, ...]
    
    if game_id not in games:
        return jsonify({'error': 'Game not found'}), 404
    
    game = games[game_id]
    
    # Validate it's player's turn
    current_player = game['players'][game['current_player']]
    if current_player['id'] != player_id:
        return jsonify({'error': 'Not your turn'}), 400
    
    # TODO: Add full word validation logic here
    # - Check tiles form valid word(s)
    # - Verify placement rules
    # - Check dictionary
    
    # Calculate score
    score = caluclate_word_score(tiles_played, game['board'])
    current_player['score'] += score
    
    # Place tiles on board
    for tile in tiles_played:
        game['board'][tile['row']][tile['col']] = {
            'letter': tile['letter'],
            'value': tile['value']
        }
        # Remove from player's hand
        current_player['hand'] = [t for t in current_player['hand'] 
                                  if not (t['letter'] == tile['letter'] and t['value'] == tile['value'])]
    
    # Draw new tiles
    tiles_to_draw = min(len(tiles_played), len(game['brick_bag']))
    for _ in range(tiles_to_draw):
        if game['brick_bag']:
            current_player['hand'].append(game['brick_bag'].pop())
    
    # Move to next player
    game['current_player'] = (game['current_player'] + 1) % len(game['players'])
    
    return jsonify({
        'status': 'success',
        'score': score,
        'new_total': current_player['score']
    })
@app.route('/api/game/<game_id>/pass', methods=['POST'])
def api_pass_turn(game_id):
    """Pass turn"""
    data = request.json
    player_id = data.get('player_id')
    
    if game_id not in games:
        return jsonify({'error': 'Game not found'}), 404
    
    game = games[game_id]
    
    current_player = game['players'][game['current_player']]
    if current_player['id'] != player_id:
        return jsonify({'error': 'Not your turn'}), 400
    
    # Move to next player
    game['current_player'] = (game['current_player'] + 1) % len(game['players'])
    
    return jsonify({'status': 'passed'})
if __name__ == '__main__':
    # Load dictionary on startup
    print("Loading Swedish dictionary...")
    try:
        dictionary = load_dictionary()
        print(f"Dictionary loaded: {len(dictionary)} words")
    except Exception as e:
        print(f"Warning: Could not load dictionary: {e}")
        dictionary = {}
    
    app.run(debug=True, host='0.0.0.0', port=5000)