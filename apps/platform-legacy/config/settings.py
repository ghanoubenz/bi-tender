import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get("PLATFORM_SECRET_KEY", "dev-only-insecure-key")
DEBUG = os.environ.get("PLATFORM_DEBUG", "1") == "1"
ALLOWED_HOSTS = os.environ.get("PLATFORM_ALLOWED_HOSTS", "*").split(",")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework.authtoken",
    "corsheaders",
    "simple_history",
    "core",
    "tenders",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "simple_history.middleware.HistoryRequestMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ]
        },
    }
]

# Postgres in docker/prod, SQLite for dependency-light local dev.
if os.environ.get("PLATFORM_DB_HOST"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.environ.get("PLATFORM_DB_NAME", "platform"),
            "USER": os.environ.get("PLATFORM_DB_USER", "platform"),
            "PASSWORD": os.environ.get("PLATFORM_DB_PASSWORD", ""),
            "HOST": os.environ["PLATFORM_DB_HOST"],
            "PORT": os.environ.get("PLATFORM_DB_PORT", "5432"),
        }
    }
else:
    DATABASES = {
        "default": {"ENGINE": "django.db.backends.sqlite3", "NAME": BASE_DIR / "platform.db"}
    }

AUTH_USER_MODEL = "core.User"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 50,
}

# Tender AI Engine — the platform is a *client* of the engine, nothing more.
ENGINE_BASE_URL = os.environ.get("ENGINE_BASE_URL", "http://localhost:8001")
ENGINE_SERVICE_TOKEN = os.environ.get("ENGINE_SERVICE_TOKEN", "dev-service-token")

CORS_ALLOWED_ORIGINS = os.environ.get("PLATFORM_CORS_ORIGINS", "http://localhost:3000").split(",")

STATIC_URL = "static/"
MEDIA_URL = "media/"
MEDIA_ROOT = os.environ.get("PLATFORM_MEDIA_ROOT", BASE_DIR / "media")

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
