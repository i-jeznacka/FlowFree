from django.contrib import admin

from .models import GameBoard, Game

admin.site.register(GameBoard)
admin.site.register(Game)