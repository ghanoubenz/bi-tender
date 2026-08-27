from django.core.management.base import BaseCommand
from rest_framework.authtoken.models import Token

from core.models import Tenant, User


class Command(BaseCommand):
    help = "Seed a dev tenant + user (demo/demo1234) with an API token."

    def handle(self, *args, **options):
        tenant, _ = Tenant.objects.get_or_create(slug="demo", defaults={"name": "Demo Contracting LLC"})
        user, created = User.objects.get_or_create(
            username="demo",
            defaults={"tenant": tenant, "role": User.Role.BID_MANAGER, "is_staff": True},
        )
        if created:
            user.set_password("demo1234")
            user.save()
        token, _ = Token.objects.get_or_create(user=user)
        self.stdout.write(self.style.SUCCESS(f"tenant={tenant.slug} user=demo password=demo1234 token={token.key}"))
