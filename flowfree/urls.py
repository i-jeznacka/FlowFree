from django.urls import path

from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("register/", views.register, name="register"),
    path("login/", views.log_in, name="login"),
    path("logout/", views.log_out, name="logout"),
    path("board_creator/", views.board_creator, name="board_creator"),
    path("new_board/", views.new_board, name="new_board"),
    path("<int:board_id>/edit_board/", views.edit_board, name="edit_board"),
    path("<int:board_id>/save_board/", views.save_board, name="save_board"),
    path("<int:board_id>/get_board/", views.get_board, name="get_board"),
    path("pick_board/", views.pick_board, name="pick_board"),
    path("<int:game_id>/play/", views.play, name="play"),
    path("<int:board_id>/new_game/", views.new_game, name="new_game"),
    path("<int:game_id>/save_game/", views.save_game, name="save_game"),
    path("<int:game_id>/get_game/", views.get_game, name="get_game"),
    path("sse/notifications/", views.notifications, name="sse_notifications"),
]
