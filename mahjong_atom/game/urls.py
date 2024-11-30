from django.urls import path
from . import views

app_name = 'game'

urlpatterns = [
    path('<int:pk>/', views.GameBoard.as_view(), name='game_board'),
    path('rules/', views.Rules.as_view(), name='rules'),
    path('games/', views.Games.as_view(), name='games'),
    path('save_results/', views.SaveResults.as_view(), name='save_results'),
    path('shuffle_tiles/', views.ShuffleTiles.as_view(), name='shuffle_tiles'),
]
