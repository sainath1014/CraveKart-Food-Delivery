import logging
import os
import tempfile
import threading
from django.conf import settings
from django.core.management import call_command
from django.db import connection, OperationalError

logger = logging.getLogger(__name__)

_bootstrap_lock = threading.Lock()
REQUIRED_TABLES = {
    'accounts_user',
    'food_food',
    'cart_cart',
    'orders_order',
    'promotions_promocode',
}


def _acquire_file_lock(lock_path):
    """Acquire an inter-process file lock on POSIX systems; returns file object or None."""
    try:
        import fcntl
        lock_file = open(lock_path, 'w')
        fcntl.flock(lock_file.fileno(), fcntl.LOCK_EX)
        return lock_file
    except (ImportError, OSError):
        return None


def _release_file_lock(lock_file):
    if lock_file is None:
        return
    try:
        import fcntl
        fcntl.flock(lock_file.fileno(), fcntl.LOCK_UN)
    except (ImportError, OSError):
        pass
    try:
        lock_file.close()
    except OSError:
        pass


def ensure_sqlite_ready():
    """
    Ensure SQLite tables and initial demo menu data exist on server startup.
    Prevents HTTP 500 ('no such table: food_food') on fresh ephemeral deploys
    when db.sqlite3 is excluded from git or build didn't run migrate.
    """
    db_config = settings.DATABASES.get('default', {})
    if 'sqlite3' not in db_config.get('ENGINE', ''):
        return

    with _bootstrap_lock:
        lock_path = os.path.join(tempfile.gettempdir(), 'cravekart_sqlite_init.lock')
        file_lock = _acquire_file_lock(lock_path)
        try:
            existing_tables = set(connection.introspection.table_names())
            if not REQUIRED_TABLES.issubset(existing_tables):
                logger.info("CraveKart: missing SQLite tables detected, running migrations...")
                call_command('migrate', interactive=False, verbosity=0)

            from accounts.models import User
            from food.models import Food

            if not Food.objects.exists() and not User.objects.exists():
                logger.info("CraveKart: empty database detected, seeding initial menu data...")
                call_command('seed_cravekart', verbosity=0)
        except OperationalError as exc:
            logger.warning("CraveKart SQLite bootstrap OperationalError: %s", exc)
        except Exception as exc:
            logger.warning("CraveKart SQLite bootstrap failed: %s", exc)
        finally:
            _release_file_lock(file_lock)
