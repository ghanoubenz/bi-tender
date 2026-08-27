import pytest
from rest_framework.test import APIClient


@pytest.fixture()
def tenant(db):
    from core.models import Tenant

    return Tenant.objects.create(name="Acme Contracting", slug="acme")


@pytest.fixture()
def other_tenant(db):
    from core.models import Tenant

    return Tenant.objects.create(name="Rival Co", slug="rival")


@pytest.fixture()
def user(tenant):
    from core.models import User

    return User.objects.create_user(username="alex", password="x", tenant=tenant, role="bid_manager")


@pytest.fixture()
def api(user):
    client = APIClient()
    client.force_authenticate(user)
    return client
