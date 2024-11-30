import ast
import random
import json

from django.shortcuts import render, redirect
from django.http import JsonResponse
import django.views.generic

from game.models import Tile, GameResult, Game


def generate_field(brands):
    layers = 10
    tiles_per_layer = 12
    total_tiles = layers * tiles_per_layer

    values = brands[:total_tiles // 2] * 2
    random.shuffle(values)

    field = []
    for layer in range(layers):
        layer_tiles = values[
                      layer * tiles_per_layer:(layer + 1) * tiles_per_layer]
        if layer_tiles:
            while len(field) > 0 and len(layer_tiles) < len(field[0]):
                layer_tiles.insert(random.randint(0, len(layer_tiles)), "")

        field.append(layer_tiles)

    return field


class GameBoard(django.views.generic.ListView):
    template_name='game/game.html'
    context_object_name = "field"

    def get_queryset(self):
        pk = self.kwargs.get('pk')
        game = django.shortcuts.get_object_or_404(Game, pk=pk)
        tiles = game.tiles.all()
        brands = []
        for tile in tiles:
            if tile.image:
                brands.append([tile.name, tile.image.url, tile.description])
            else:
                brands.append([tile.name, "", tile.description])

        field = generate_field(brands)
        return field

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        pk = self.kwargs.get('pk')
        game = django.shortcuts.get_object_or_404(Game, pk=pk)
        context["game"] = game
        return context

class Rules(django.views.generic.View):
    def get(self, request, *args, **kwargs):
        return django.shortcuts.render(request, "game/rules.html")


class SaveResults(django.views.generic.View):
    def post(self, request):
        data = json.loads(request.body)
        time_in_seconds = data.get('time')  # Получаем время в секундах
        count_shuffled = data.get("count_shuffled")

        game_pk = data.get("game_pk")
        game = django.shortcuts.get_object_or_404(Game, pk=game_pk)

        user = request.user
        if user.is_authenticated:
            GameResult.objects.create(
                user=user,
                time=time_in_seconds,
                count_shuffled=count_shuffled,
                game=game,
            )
        else:
            GameResult.objects.create(
                time=time_in_seconds,
                count_shuffled=count_shuffled,
                game=game,
            )

        return JsonResponse({'status': 'success'})

class ShuffleTiles(django.views.generic.View):
    def post(self, request):
        data = json.loads(request.body)
        tiles = data.get('tiles', [])

        shuffled_set = set()
        shuffled_tiles = tiles[:]
        for shuffle_tile in shuffled_tiles:
            if shuffle_tile["value"] == "undefined":
                continue
            if "[" not in shuffle_tile["value"]:
                name, img, description = shuffle_tile["value"].split(",")
            else:
                name, img, description = ast.literal_eval(shuffle_tile["value"])
            shuffled_set.add((name, img, description))
        shuffled_tiles = [list(shuffled_tile) for shuffled_tile in shuffled_set]
        shuffled_tiles = generate_field(shuffled_tiles)

        return JsonResponse({
            'status': 'success',
            'shuffled_tiles': shuffled_tiles
        })

class Games(django.views.generic.ListView):
    template_name='game/games.html'
    context_object_name = "games"
    queryset = Game.objects.all()