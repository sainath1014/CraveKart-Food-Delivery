@echo off
echo ========================================================
echo   Starting CraveKart Backend (Django REST Framework)...
echo ========================================================
cd /d "%~dp0backend"
call "..\venv\Scripts\activate.bat"
python manage.py runserver 0.0.0.0:8000
pause
