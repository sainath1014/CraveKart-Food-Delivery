import os
import shutil
import subprocess
import sys
import tempfile
from unittest.mock import patch
from django.conf import settings
from django.test import SimpleTestCase, TestCase
from common.db_bootstrap import ensure_sqlite_ready


class SQLiteBootstrapUnitTests(TestCase):
    def test_skips_when_engine_is_not_sqlite(self):
        non_sqlite = {'default': {'ENGINE': 'django.db.backends.postgresql'}}
        with patch.dict(settings.DATABASES, non_sqlite, clear=False), \
             patch('common.db_bootstrap.call_command') as mock_cmd:
            ensure_sqlite_ready()
        mock_cmd.assert_not_called()

    def test_migrates_and_seeds_when_tables_missing(self):
        with patch('common.db_bootstrap.connection') as mock_conn, \
             patch('common.db_bootstrap.call_command') as mock_cmd, \
             patch('accounts.models.User.objects') as mock_user_mgr, \
             patch('food.models.Food.objects') as mock_food_mgr:
            mock_conn.introspection.table_names.return_value = []
            mock_food_mgr.exists.return_value = False
            mock_user_mgr.exists.return_value = False

            ensure_sqlite_ready()

        mock_cmd.assert_any_call('migrate', interactive=False, verbosity=0)
        mock_cmd.assert_any_call('seed_cravekart', verbosity=0)


class FreshRenderDeploySimulationTests(SimpleTestCase):
    def test_wsgi_bootstraps_fresh_empty_sqlite_and_serves_food_list(self):
        temp_dir = tempfile.mkdtemp(prefix='cravekart_wsgi_sim_')
        temp_db_path = os.path.join(temp_dir, 'db.sqlite3')
        backend_dir = str(settings.BASE_DIR)

        script = (
            "import os, django\n"
            "os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'\n"
            "os.environ['DEBUG'] = 'False'\n"
            "os.environ['DATABASE_URL'] = '   '\n"
            "os.environ['ALLOWED_HOSTS'] = 'cravekart-api.onrender.com,localhost,127.0.0.1'\n"
            "django.setup()\n"
            "from django.conf import settings\n"
            "from django.db import connections\n"
            "from rest_framework.test import APIClient\n"
            "connections.close_all()\n"
            "settings.DATABASES['default']['NAME'] = os.environ['SIM_DB_PATH']\n"
            "import config.wsgi\n"
            "resp = APIClient().get('/api/food/list/', HTTP_HOST='cravekart-api.onrender.com')\n"
            "assert resp.status_code == 200, resp.content\n"
            "data = resp.json()\n"
            "assert data['success'] is True and data['count'] >= 29\n"
            "connections.close_all()\n"
        )

        env = dict(os.environ)
        env['SIM_DB_PATH'] = temp_db_path
        try:
            proc = subprocess.run(
                [sys.executable, '-c', script],
                cwd=backend_dir,
                env=env,
                capture_output=True,
                text=True,
                timeout=30,
            )
            self.assertEqual(proc.returncode, 0, msg=f"STDOUT:\n{proc.stdout}\nSTDERR:\n{proc.stderr}")
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)
