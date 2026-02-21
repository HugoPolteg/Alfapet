import math

def has_adjacent_tile(row, col, board, board_dimensions):
    """Check if a position has an adjacent tile (not diagonal)"""
    directions = [(0, 1), (0, -1), (1, 0), (-1, 0)]
    for dr, dc in directions:
        new_row, new_col = row + dr, col + dc
        if 0 <= new_row < board_dimensions[0] and 0 <= new_col < board_dimensions[1]:
            if board[new_row][new_col] is not None:
                return True
    return False


def validate_placement(tiles_played, old_tile_positions, is_first_move, board_dimensions=[17, 17]) -> dict:
    """Validate placement according to rules
    Args:
        tiles_played: List of {row, col, letter, value} dicts
        tile_positions: 2D array of dicts representing the game board, position of old tiles
        is_first_move: bool whether or not it's the first move
        board_dimensions: array of the board's dimensions
    Returns:
        dict: {'valid': bool, 'reason' : str or None}
    """
    #Check for middle placement if starting
    if not tiles_played or len(tiles_played) == 0:
        return {'valid' : False, 'reason' : "Inga brickor placerade!"}
    if is_first_move:
        if len(tiles_played) == 1:
            tile = tiles_played[0]
            return {'valid': False, 'reason': 'Går ej att spela enskiljd bricka som första ord!'}
        placed_in_middle = False
        for tile in tiles_played:
            if tile["row"] == math.floor(board_dimensions[0]/2) and tile["col"] == math.floor(board_dimensions[1]/2):
                placed_in_middle = True
        if not placed_in_middle:
            return {'valid': False, 'reason': 'Ingen bricka placerad i mitten!'}
    else:
        if len(tiles_played) == 1:
            tile = tiles_played[0]
            if not has_adjacent_tile(tile['row'], tile['col'], old_tile_positions, board_dimensions):
                return {'valid': False, 'reason': 'Enskild bricka måste placeras bredvid existerande ord!'}
            

    rows = [tile['row'] for tile in tiles_played]
    cols = [tile['col'] for tile in tiles_played]
    vertical = len(set(cols)) == 1
    horizontal = len(set(rows)) == 1
    if not (horizontal or vertical):
        return {'valid' : False, 'reason' : "Brickor måste placeras i en vågrät eller lodrät linje"}
    if horizontal:
        row = rows[0]
        cols_sorted = sorted(cols)
        for i in range(cols_sorted[0], cols_sorted[-1]):
            if old_tile_positions[row][i] is None and i not in cols:
                return {'valid' : False, 'reason' : "Brickor måste placeras utan mellanrum"}
    else:
        col = cols[0]
        rows_sorted = sorted(rows)
        for i in range(rows_sorted[0], rows_sorted[-1]):
            if old_tile_positions[i][col] is None and i not in rows:
                return {'valid' : False, 'reason' : "Brickor måste placeras utan mellanrum"}
    if not is_first_move:
        has_connection = False
        for tile in tiles_played:
            if has_adjacent_tile(tile['row'], tile['col'], old_tile_positions, board_dimensions):
                has_connection = True
                break
        
        if not has_connection:
            return {'valid': False, 'reason': 'Nya brickor måste placeras vid existerande ord!'}
        
    return {'valid': True, 'reason' : None}

def extract_word_from_board(origin_tile, all_tile_positions, horizontal):
    """
    Extracts a single word in a direction
    Args:
        origin_tile: dict {row, col, letter, value}
        all_tile_positions: 2D array of dicts representing the game board, position of all tiles(including new)
        horizontal: Bool, whether or not the word is placed horizontally
    
    Returns:
        dict or None
    """
    if horizontal:
        row = origin_tile['row']
        origin_index = origin_tile['col']
        min_index = origin_index
        max_index = origin_index
        while min_index > 0 and all_tile_positions[row][min_index - 1] is not None:
            min_index -= 1
        while max_index < len(all_tile_positions[row]) - 1 and all_tile_positions[row][max_index + 1] is not None:
            max_index += 1
        if min_index == max_index:
            return None
        else:
            word = ""
            tiles = []
            for i in range(min_index, max_index+1):
                word += all_tile_positions[row][i]["letter"]
                tiles.append({"value": all_tile_positions[row][i]["value"], "col": i, "row": row})
            return {"word": word, "tiles": tiles}

    else:
        col = origin_tile['col']
        origin_index = origin_tile['row']
        min_index = origin_index
        max_index = origin_index
        while min_index > 0 and all_tile_positions[min_index - 1][col] is not None:
            min_index -= 1
        while max_index < len(all_tile_positions) and all_tile_positions[max_index + 1][col] is not None:
            max_index += 1
        if min_index == max_index:
            return None
        else:
            word = ""
            tiles = []
            for i in range(min_index, max_index+1):
                word += all_tile_positions[i][col]["letter"]
                tiles.append({"value": all_tile_positions[i][col]["value"], "col": col, "row": i})
            return {"word": word, "tiles": tiles}
        


def extract_words_from_board(tiles_played, old_tile_positions):
    """
    Extract all words formed by the new tiles
    
    Args:
        tiles_played: List of {row, col, letter, value} dicts
        old_tile_positions: 2D array of dicts representing the game board, position of old tiles
    
    Returns:
        Dict with list of word dicts: {main_word: str, words : [{'word': str, 'tiles': [{"letter": str, "col": int, "row" : int}]]}
    """
    temp_board = [row[:] for row in old_tile_positions]  # Deep copy
    for tile in tiles_played:
        temp_board[tile['row']][tile['col']] = {
            'letter': tile['letter'],
            'value': tile['value']
        }
    rows = [tile['row'] for tile in tiles_played]
    horizontal = len(set(rows)) == 1
    if len(tiles_played) == 1:
        if extract_word_from_board(tiles_played[0], temp_board, True) is None:
            horizontal = False
    main_word = ""
    words = []
    if horizontal:
        word = extract_word_from_board(tiles_played[0], temp_board, True)
        main_word = word['word']
        words.append(word)
        for tile in tiles_played:
            perp_word = extract_word_from_board(tile, temp_board, False)
            if perp_word is not None:
                words.append(perp_word)
    else:
        word = extract_word_from_board(tiles_played[0], temp_board, False)
        main_word = word['word']
        words.append(word)
        for tile in tiles_played:
            perp_word = extract_word_from_board(tile, temp_board, True)
            if perp_word is not None:
                words.append(perp_word)
    return [main_word, words]