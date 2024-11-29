import django.contrib.admin
import django.core.exceptions

import game.models

@django.contrib.admin.register(game.models.Tile)
class TileAdmin(django.contrib.admin.ModelAdmin):
    list_display = (
        game.models.Tile.name.field.name,
        game.models.Tile.image_tmb,
    )

@django.contrib.admin.register(game.models.GameResult)
class GameResultAdmin(django.contrib.admin.ModelAdmin):
    list_display = (
        game.models.GameResult.user.field.name,
        game.models.GameResult.time.field.name,
        game.models.GameResult.count_shuffled.field.name,
        game.models.GameResult.created_at.field.name,
    )

__all__ = ()