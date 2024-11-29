from django.shortcuts import render
from django.http import JsonResponse
import random

# Конфигурация игрового поля (слои)
def generate_field():
    layers = 3
    tiles_per_layer = 16  # Количество плиток на слой (уменьшите/увеличьте для сложности)
    total_tiles = layers * tiles_per_layer

    # Логотипы автомобильных брендов (можно заменить на реальные пути к изображениям)
    brands = [
        "Toyota", "BMW", "Ford", "Audi", "Honda",
        "Chevrolet", "Tesla", "Nissan", "Kia", "Hyundai"
    ]

    # Создаем пары логотипов
    values = brands[:total_tiles // 2] * 2
    random.shuffle(values)

    # Разбиваем на слои
    field = []
    for layer in range(layers):
        layer_tiles = values[layer * tiles_per_layer:(layer + 1) * tiles_per_layer]
        field.append(layer_tiles)

    print(field)
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

# Сохранение результатов игры
def save_results(request):
    if request.method == 'POST':
        player_name = request.POST.get('name')
        time_spent = request.POST.get('time_spent')
        shuffles_used = request.POST.get('shuffles')
        # Сохраните результаты в базе данных или файл
        return JsonResponse({'status': 'success'})
    return JsonResponse({'error': 'Invalid request'})
