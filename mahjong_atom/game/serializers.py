from rest_framework import serializers
from game.models import Game, Tile


class TileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tile
        fields = '__all__'


class GameSerializer(serializers.ModelSerializer):
    tiles = TileSerializer(many=True, read_only=True)

    class Meta:
        model = Game
        fields = ['id', 'player_name', 'score', 'tiles']
