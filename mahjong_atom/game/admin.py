import django.contrib.admin
import django.core.exceptions

import game.models

@django.contrib.admin.register(game.models.Tile)
class TileAdmin(django.contrib.admin.ModelAdmin):
    list_display = (
        game.models.Tile.name.field.name,
        game.models.Tile.image_tmb,
    )

__all__ = ()