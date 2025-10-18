from rest_framework import serializers

from .models import GameBoard, Game

class GameBoardSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameBoard
        fields = ['dots']

class BoardNotificationSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()

    class Meta:
        model = GameBoard
        fields = ['id', 'name', 'username']

    def get_username(self, obj):
        return obj.user.username

class GameNotificationSerializer(serializers.ModelSerializer):
    board_name = serializers.SerializerMethodField()
    username = serializers.SerializerMethodField()

    class Meta:
        model = Game
        fields = ['id', 'board_name', 'username']

    def get_board_name(self, obj):
        return obj.board.name

    def get_username(self, obj):
        return obj.user.username
