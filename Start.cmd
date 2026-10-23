@echo off
cd /d "%~dp0"
where py >nul 2>nul
if errorlevel 1 goto python
py -3 server.py
goto end
:python
python server.py
:end
if errorlevel 1 echo Startup failed. Install Python 3 or check whether port 1610 is available.
pause
