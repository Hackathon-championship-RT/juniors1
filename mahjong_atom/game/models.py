from django.db import models

class Game(models.Model):
    player_name = models.CharField(max_length=100)
    score = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

class Tile(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='tiles')
    value = models.CharField(max_length=10)  # Например, "Bamboo_5" или "Dragon_Red"
    is_matched = models.BooleanField(default=False)
    position_x = models.IntegerField()
    position_y = models.IntegerField()
