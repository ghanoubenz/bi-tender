from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    # Django Admin is an INTERNAL ops tool only — never exposed to customers.
    path("internal/admin/", admin.site.urls),
    path("api/auth/token/", obtain_auth_token),
    path("api/", include("tenders.urls")),
    path("health", lambda request: JsonResponse({"status": "ok", "service": "tender-platform"})),
]
