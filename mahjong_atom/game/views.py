import random
import json

from django.shortcuts import render, redirect
from django.http import JsonResponse

from game.models import Tile, GameResult


# Конфигурация игрового поля (слои)
def generate_field():
    layers = 3
    tiles_per_layer = 12  # Количество плиток на слой (уменьшите/увеличьте для сложности)
    total_tiles = layers * tiles_per_layer

    # Логотипы автомобильных брендов (можно заменить на реальные пути к изображениям)
    tiles = Tile.objects.all()
    brands = []
    for tile in tiles:
        if tile.image:
            brands.append([tile.name, tile.image.url])
        else:
            brands.append([tile.name, ""])

    # Создаем пары логотипов
    values = brands[:total_tiles // 2] * 2
    random.shuffle(values)

    # Разбиваем на слои
    field = []
    for layer in range(layers):
        layer_tiles = values[
                      layer * tiles_per_layer:(layer + 1) * tiles_per_layer]
        if layer_tiles:
            while len(field) > 0 and len(layer_tiles) < len(field[0]):
                layer_tiles.insert(random.randint(0, len(layer_tiles)), "")

        field.append(layer_tiles)

    return field


# Отображение главной страницы
def game_board(request):
    field = generate_field()
    return render(request, 'game/game.html', {'field': field})


# Логика проверки доступности пары плиток
def check_match(request):
    if request.method == 'POST':
        tile1 = request.POST.get('tile1')
        tile2 = request.POST.get('tile2')
        if tile1 == tile2:
            return JsonResponse({'match': True})
        return JsonResponse({'match': False})
    return JsonResponse({'error': 'Invalid request'})


def save_results(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        time_in_seconds = data.get('time')  # Получаем время в секундах

        user = request.user
        if user.is_authenticated:
            GameResult.objects.create(
                user=user,
                time=time_in_seconds,
            )
        else:
            GameResult.objects.create(
                time=time_in_seconds,
            )

        return JsonResponse({'status': 'success'})
