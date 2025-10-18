from django.shortcuts import render, get_object_or_404, redirect
from django.template import loader
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse, StreamingHttpResponse
from rest_framework import generics, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
import json, time
from rest_framework.renderers import JSONRenderer
from queue import Queue, Empty

from .models import GameBoard, Game
from .forms import GameBoardForm
from .serializers import GameBoardSerializer, BoardNotificationSerializer, GameNotificationSerializer
from .signals import connected_clients, new_gameboard_signal, new_game_signal

def register(request):
    if request.method == 'POST':
        form = UserCreationForm(data=request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('/')
    else:
        form = UserCreationForm()
    return render(request, 'flowfree/register.html', {'form': form})


def log_in(request):
    if request.method == 'POST':
        form = AuthenticationForm(data=request.POST)
        if form.is_valid():
            login(request, form.get_user())
            return redirect('/flowfree/')
    else:
        form = AuthenticationForm()
    return render(request, 'flowfree/login.html', {'form': form})


def log_out(request):
    logout(request)
    return redirect('/flowfree/')


def home(request):
    logged = False
    admin = False
    token = ''
    if request.user.is_authenticated:
        logged = True
        token, _ = Token.objects.get_or_create(user=request.user)
        if request.user.is_superuser:
            admin = True
    return render(request, 'flowfree/home.html', {'logged': logged, 'admin': admin, 'token': token})


@login_required(login_url='/flowfree/login/')
def pick_board(request):
    my_boards = Game.objects.filter(user=request.user)
    boards = GameBoard.objects.all()
    return render(request, 'flowfree/pick_board.html', {'my_boards': my_boards, 'boards': boards})


@login_required(login_url='/flowfree/login/')
def new_game(request, board_id):
    game = Game.objects.create(user=request.user, board=get_object_or_404(GameBoard, pk=board_id))
    return redirect(f'/flowfree/{game.id}/play')


@login_required(login_url='/flowfree/login/')
def play(request, game_id):
    game = get_object_or_404(Game, pk=game_id)
    board = game.board

    return render(request, 'flowfree/play.html', {'bid': board.id, 'gid': game_id, 'x': board.rows, 'y': board.cols})


def board_creator(request):
    boards = []
    if request.user.is_authenticated:
        boards = GameBoard.objects.filter(user=request.user)

    return render(request, 'flowfree/board_creator.html', {'boards': boards})


@login_required(login_url='/flowfree/login/')
def new_board(request):
    board = GameBoard.objects.create(user=request.user)
    return redirect(f'/flowfree/{board.id}/edit_board')


@login_required(login_url='/flowfree/login/')
def edit_board(request, board_id):
    board = get_object_or_404(GameBoard, pk=board_id)
    if request.method == 'POST':
        if 'save_board' in request.POST:
            form = GameBoardForm(request.POST, instance=board)
            if form.is_valid():
                board = form.save(commit=False)
                board.dots = []
                board.save()
                return redirect(f'/flowfree/{board_id}/edit_board')
        elif 'delete_board' in request.POST:
            board.delete()
            return redirect('/flowfree/')

    form = GameBoardForm(instance=board)

    return render(request, 'flowfree/edit_board.html', {'form': form, 'id': board_id, 'x': board.rows, 'y': board.cols})


@require_http_methods(['POST'])
def save_board(request, board_id):
    try:
        board = get_object_or_404(GameBoard, pk=board_id)
        data = json.loads(request.body.decode('utf-8'))

        #Validate data
        if not isinstance(data, list):
            return JsonResponse({'error': 'Expected a list of dots'}, status=400)

        dct = {}

        for item in data:
            if not (isinstance(item, (list)) and len(item) == 3):
                return JsonResponse({'error': f'Invalid dot format: {item}'}, status=400)

            r, c, s = item
            if not (isinstance(r, int) and isinstance(c, int) and isinstance(s, str)):
                return JsonResponse({'error': f'Invalid types in dot: {item}'}, status=400)
            
            if s not in dct.keys():
                dct[s] = 0
            dct[s] += 1

            if r < 1 or r > board.rows or c < 1 or c > board.cols:
                return JsonResponse({'error': f'Dot outside board: {item}'}, status=400)

        for key, val in dct.items():
            if val != 2:
                return JsonResponse({'error': f'Invalid number of dots in color: {key}'}, status=400)

        board.dots = data
        board.save()

        return JsonResponse({'message': 'OK'}, status=200)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)


@require_http_methods(['GET'])
def get_board(_, board_id):
    board = get_object_or_404(GameBoard, pk=board_id)
    return JsonResponse({'data': board.dots}, status=200)


@require_http_methods(['POST'])
def save_game(request, game_id):
    try:
        game = get_object_or_404(Game, pk=game_id)
        data = json.loads(request.body.decode('utf-8'))

        # Validate data
        if not isinstance(data, list):
            return JsonResponse({'error': 'Expected a list of lines'}, status=400)

        colors = [[['', 0] for _ in range(game.board.rows + 1)] for _ in range(game.board.cols + 1)]

        for item in data:
            if not (isinstance(item, dict) and len(item.values()) == 5):
               return JsonResponse({'error': f'Invalid line format: {item}'}, status=400)

            if not (isinstance(item['r1'], int) and isinstance(item['c1'], int) and
                    isinstance(item['r2'], int) and isinstance(item['c2'], int) and isinstance(item['color'], str)):
                return JsonResponse({'error': f'Invalid types in line: {item}'}, status=400)

            r1, r2, c1, c2, s = item['r1'], item['r2'], item['c1'], item['c2'], item['color']

            if not abs(r1 - r2) + abs(c1 - c2) == 1:
                return JsonResponse({'error': f'Invalid values in line: {item}'}, status=400)

            for r, c in [(r1, c1), (r2, c2)]:
                if colors[r][c][0] == '':
                    colors[r][c] = s, 1
                elif colors[r][c][0] == s:
                    if colors[r][c][1] < 2:
                        colors[r][c] = s, 2
                    else:
                        return JsonResponse({'error': f'Too many lines in cell: ({r}, {c})'}, status=400)
                else:
                    return JsonResponse({'error': f'Multiple colors in cell: ({r}, {c})'}, status=400)

        def to_rgb(hex):
            if hex[0] != '#':
                return hex
            return f'rgb({int(hex[1:3], 16)}, {int(hex[3:5], 16)}, {int(hex[5:7], 16)})'

        for c, r, color in game.board.dots:
            if colors[r][c][1] > 0:
                if colors[r][c][0] != color and colors[r][c][0] != to_rgb(color):
                    return JsonResponse({'error': f'Wrong line color on dot in cell: ({r}, {c})'}, status=400)
                if colors[r][c][1] > 1:
                    return JsonResponse({'error': f'Too many lines on dot in cell: ({r}, {c})'}, status=400)
                else:
                    colors[r][c] = color, 2

        game.lines = data
        game.save()

        # Check if game is won
        won = True
        for r in range(1, game.board.cols + 1):
            for c in range(1, game.board.rows + 1):
                if colors[r][c][1] != 2:
                    won = False

        if won:
            return JsonResponse({'message': 'GAME'}, status=200)

        else:
            return JsonResponse({'message': 'OK'}, status=200)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)


@require_http_methods(['GET'])
def get_game(_, game_id):
    game = get_object_or_404(Game, pk=game_id)
    return JsonResponse({'data': game.lines}, status=200)


def notifications(_):
    client_queue = Queue()
    connected_clients.add(client_queue)

    def generate():
        try:
            while True:
                try:
                    message = client_queue.get(timeout=10)
                    print(message)
                    yield message
                except Empty:
                    yield ': keep-alive\n\n'
        except GeneratorExit:
            connected_clients.remove(client_queue)  # clean up on disconnect

    response = StreamingHttpResponse(generate(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    return response


def gameboard_notification(sender, instance, **kwargs):
    serializer = BoardNotificationSerializer(instance)
    data = JSONRenderer().render(serializer.data).decode('utf-8')
    msg = f'event: newBoard\ndata: {data}\n\n'
    for client_queue in list(connected_clients):
        client_queue.put(msg)


def game_notification(sender, instance, **kwargs):
    serializer = GameNotificationSerializer(instance)
    data = JSONRenderer().render(serializer.data).decode('utf-8')
    msg = f'event: newGame\ndata: {data}\n\n'
    for client_queue in list(connected_clients):
        client_queue.put(msg)

new_gameboard_signal.connect(gameboard_notification)
new_game_signal.connect(game_notification)