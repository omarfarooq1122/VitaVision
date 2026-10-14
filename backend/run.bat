@echo off
REM One command to run the VitaVision backend on Windows:  backend\run.bat
cd /d %~dp0
if not exist .venv python -m venv .venv
call .venv\Scripts\activate
if not exist .env copy .env.example .env
if not exist .venv\.installed (
  pip install torch --index-url https://download.pytorch.org/whl/cpu
  pip install -r requirements.txt
  echo done> .venv\.installed
)
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
