import random

def generate_tiles():
    tile_types = ['Bamboo', 'Character', 'Circle', 'Dragon']
    values = [str(i) for i in range(1, 10)] + ['Red', 'Green', 'White']
    tiles = []

    for tile_type in tile_types:
        for value in values:
            tile = f"{tile_type}_{value}"
            tiles.append(tile)
            tiles.append(tile)  # Каждая плитка должна быть в паре.

    random.shuffle(tiles)
    return tiles

def check_match(tile1, tile2):
    return tile1.value == tile2.value
