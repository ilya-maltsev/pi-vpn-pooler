import logging.handlers
import os
import socket
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-dev-key-change-in-production')
DEBUG = os.environ.get('DJANGO_DEBUG', 'True').lower() in ('true', '1', 'yes')
ALLOWED_HOSTS = os.environ.get('DJANGO_ALLOWED_HOSTS', '*').split(',')
CSRF_TRUSTED_ORIGINS = os.environ.get(
    'CSRF_TRUSTED_ORIGINS',
    'http://127.0.0.1:8000,http://localhost:8000,http://127.0.0.1:5000,http://localhost:5000'
).split(',')

INSTALLED_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'pooler',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.template.context_processors.i18n',
                'django.contrib.messages.context_processors.messages',
                'pooler.context_processors.pi_status',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# No database — pools stored in YAML, allocations are live from PI
DATABASES = {}

# Session stored in signed cookies (no DB needed)
SESSION_ENGINE = 'django.contrib.sessions.backends.signed_cookies'
SESSION_COOKIE_AGE = 86400  # 24 hours

from django.utils.translation import gettext_lazy as _

LANGUAGE_CODE = 'ru'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_L10N = True
USE_TZ = True

LANGUAGES = [
    ('ru', _('Russian')),
    ('en', _('English')),
]

LOCALE_PATHS = [
    BASE_DIR / 'locale',
]

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

LOGIN_URL = '/login/'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- Pool storage (YAML file) ------------------------------------------------
POOLS_FILE = os.environ.get('POOLS_FILE', str(BASE_DIR / 'data' / 'pools.yaml'))

# --- privacyIDEA connection ---------------------------------------------------
PI_API_URL = os.environ.get('PI_API_URL', 'https://localhost:8443')
PI_VERIFY_SSL = os.environ.get('PI_VERIFY_SSL', 'false').lower() in ('true', '1', 'yes')

# --- Logging -----------------------------------------------------------------
SYSLOG_ENABLED = os.environ.get('SYSLOG_ENABLED', 'false').lower() in ('true', '1', 'yes')
SYSLOG_HOST = os.environ.get('SYSLOG_HOST', '')
SYSLOG_PORT = int(os.environ.get('SYSLOG_PORT', '514'))
SYSLOG_PROTO = os.environ.get('SYSLOG_PROTO', 'udp').lower()
SYSLOG_FACILITY = os.environ.get('SYSLOG_FACILITY', 'local0')
SYSLOG_TAG = os.environ.get('SYSLOG_TAG', 'pi-vpn-pooler')
SYSLOG_LEVEL = os.environ.get('SYSLOG_LEVEL', 'INFO').upper()

_pooler_handlers = ['console']
_logging_handlers = {
    'console': {
        'class': 'logging.StreamHandler',
    },
}

if SYSLOG_ENABLED and SYSLOG_HOST:
    _logging_handlers['syslog'] = {
        'level': SYSLOG_LEVEL,
        'class': 'logging.handlers.SysLogHandler',
        'address': (SYSLOG_HOST, SYSLOG_PORT),
        'socktype': (socket.SOCK_STREAM if SYSLOG_PROTO == 'tcp'
                     else socket.SOCK_DGRAM),
        'facility': logging.handlers.SysLogHandler.facility_names.get(
            SYSLOG_FACILITY, logging.handlers.SysLogHandler.LOG_LOCAL0),
        'formatter': 'syslog',
    }
    _pooler_handlers.append('syslog')

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'syslog': {
            'format': SYSLOG_TAG + ': [%(levelname)s] %(name)s: %(message)s',
        },
    },
    'handlers': _logging_handlers,
    'loggers': {
        'pooler': {
            'handlers': _pooler_handlers,
            'level': os.environ.get('DJANGO_LOG_LEVEL', 'INFO'),
        },
    },
}
