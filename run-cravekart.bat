@echo off
echo ========================================================
echo   Launching CraveKart Full Stack Food Delivery App
echo   Frontend: http://localhost:5173
echo   Admin Panel: http://localhost:5173/admin
echo   Backend API: http://127.0.0.1:8000/api/
echo ========================================================
start "CraveKart Backend Server" cmd /k "cd /d "%~dp0backend" && call "..\venv\Scripts\activate.bat" && python manage.py runserver 0.0.0.0:8000"
timeout /t 3 /nobreak >nul
start "CraveKart Frontend Server" cmd /k "cd /d "%~dp0frontend" && npm run dev"
echo Servers started! You can now open http://localhost:5173 in your browser.
