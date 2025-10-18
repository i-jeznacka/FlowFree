from django import forms
from .models import GameBoard

class GameBoardForm(forms.ModelForm):
    class Meta:
        model = GameBoard
        fields = ['name', 'rows', 'cols']


