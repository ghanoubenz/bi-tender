import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models


class Tenant(models.Model):
    """One customer company. Every business row in the platform hangs off a tenant."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    settings = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.name


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "admin"
        BID_MANAGER = "bid_manager"
        CONTRIBUTOR = "contributor"
        VIEWER = "viewer"

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="users", null=True)
    role = models.CharField(max_length=32, choices=Role.choices, default=Role.CONTRIBUTOR)


class TenantOwnedModel(models.Model):
    """Base for all tenant-owned business models. RLS policies are added on top
    of this in Postgres (defense in depth); the app layer always filters."""

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="+")

    class Meta:
        abstract = True
