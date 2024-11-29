from django.urls import path
from . import views

app_name = 'game'  # Указываем namespace приложения для организации URL-адресов

urlpatterns = [
    path('', views.game_board, name='game_board'),  # Главная страница игры
    path('check_match/', views.check_match, name='check_match'),  # Проверка совпадений
    path('save_results/', views.save_results, name='save_results'),  # Сохранение результатов
    path('shuffle_tiles/', views.shuffle_tiles, name='shuffle_tiles'),
]
