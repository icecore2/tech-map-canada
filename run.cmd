@echo off
REM Activate virtual environment
call venv\Scripts\activate
python app.py --reload --port 8005
pause