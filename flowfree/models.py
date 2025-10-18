from django.db import models
from django.contrib.auth.models import User
from django.db.models import signals

class GameBoard(models.Model):
    name = models.CharField(max_length=200, default='My board')
    rows = models.IntegerField(default=0)
    cols = models.IntegerField(default=0)
    dots = models.JSONField(default=list)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return f'{self.pk}. {self.name}'

class Game(models.Model):
    board = models.ForeignKey(GameBoard, on_delete=models.CASCADE)
    lines = models.JSONField(default=list)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return f'{self.board.name} ({self.pk})'