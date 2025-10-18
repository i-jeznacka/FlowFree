from django.apps import AppConfig


class FlowfreeConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "flowfree"

    def ready(self):
        import flowfree.signals
