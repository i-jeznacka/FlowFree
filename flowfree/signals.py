from django.db.models.signals import post_save
from django.dispatch import receiver, Signal
from queue import Queue
from typing import Set

from .models import GameBoard, Game

new_gameboard_signal = Signal()
new_game_signal = Signal()

connected_clients: Set[Queue] = set()

@receiver(post_save, sender=GameBoard)
def new_gameboard_handler(sender, instance, created, **kwargs):
    if created:
        new_gameboard_signal.send(sender=sender, instance=instance)

@receiver(post_save, sender=Game)
def new_game_handler(sender, instance, created, **kwargs):
    if created:
        new_game_signal.send(sender=sender, instance=instance)
