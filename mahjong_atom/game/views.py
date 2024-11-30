import ast
import json
import random

import django.views.generic
from django.contrib.auth.models import User
from django.db.models import Min, Max
from django.http import JsonResponse
from django.shortcuts import render
from game.models import GameResult, Game


def generate_field(brands, lvl):
    layers = 100
    lvl = int(lvl)
    if lvl == 1:
        tiles_per_layer = 16
    if lvl == 2:
        tiles_per_layer = 25
    elif lvl == 3:
        tiles_per_layer = 49
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
    template_name = 'game/game.html'
    context_object_name = "field"

    def get_queryset(self):
        pk = self.kwargs.get('pk')
        lvl = int(
            self.kwargs.get('lvl', 1))  # Уровень сложности по умолчанию - 1
        game = django.shortcuts.get_object_or_404(Game, pk=pk)
        tiles = game.tiles.all()

        brands = [
            [tile.name, tile.image.url, tile.description] if tile.image else [
                tile.name, "", tile.description]
            for tile in tiles
        ]

        field = generate_field(brands * lvl, lvl)

        return field

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        pk = self.kwargs.get('pk')
        lvl = self.kwargs.get('lvl')
        game = django.shortcuts.get_object_or_404(Game, pk=pk)
        context["game"] = game
        context["lvl"] = lvl
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


def check_match(request):
    return render(request, 'game/check_match.html')


class Leaderboard(django.views.generic.View):
    def get(self, request):
        user_results = None
        if request.user.is_authenticated:
            user_results = GameResult.objects.filter(
                user=request.user).order_by(
                '-created_at')

        leader_results = (
            GameResult.objects
            .values('user', "game__name")
            .annotate(
                best_time=Min('time'),
                best_count_shuffled=Min('count_shuffled'),
                best_result_date=Max('created_at'),
                last_time=Max('time'),
                last_count_shuffled=Max('count_shuffled'),
                last_result_date=Max('created_at'),
            )
            .order_by('best_time')
        )

        leader_results = [
            {
                'user': None if not entry['user'] else User.objects.get(
                    id=entry['user']),
                'game': entry["game__name"],
                'best_time': entry['best_time'],
                'best_count_shuffled': entry['best_count_shuffled'],
                'best_result_date': entry['best_result_date'],
                'last_time': entry['last_time'],
                'last_count_shuffled': entry['last_count_shuffled'],
                'last_result_date': entry['last_result_date'],
            }
            for entry in leader_results
        ]
        return render(request, 'game/results.html', {
            'user_results': user_results,
            'leader_results': leader_results
        })


class ShuffleTiles(django.views.generic.View):
    def post(self, request):
        data = json.loads(request.body)
        tiles = data.get('tiles', [])
        lvl = data.get("lvl", 1)

        shuffled_dict = {}
        shuffled_list = list()
        shuffled_tiles = tiles[:]
        for shuffle_tile in shuffled_tiles:
            if shuffle_tile["value"] == "undefined":
                continue
            if "[" not in shuffle_tile["value"]:
                name, img = shuffle_tile["value"].split(",")[:2]
                description = ','.join(shuffle_tile["value"].split(",")[2:])
            else:
                name, img, description = ast.literal_eval(
                    shuffle_tile["value"])
            if name in shuffled_dict and not shuffled_dict[name]:
                shuffled_dict[name] = True
            else:
                shuffled_dict[name] = False
                shuffled_list.append((name, img, description))

        shuffled_tiles = [list(shuffled_tile) for shuffled_tile in
                          shuffled_list]
        shuffled_tiles = generate_field(shuffled_tiles, lvl)

        return JsonResponse({
            'status': 'success',
            'shuffled_tiles': shuffled_tiles
        })


class Games(django.views.generic.ListView):
    template_name = 'game/games.html'
    context_object_name = "games"
    queryset = Game.objects.all()
