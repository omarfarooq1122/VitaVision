#!/usr/bin/env bash
# One command to run the VitaVision backend:  ./backend/run.sh
set -e
cd "$(dirname "$0")"
[ -d .venv ] || python3 -m venv .venv
source .venv/bin/activate
[ -f .env ] || cp .env.example .env
if [ ! -f .venv/.installed ] || [ requirements.txt -nt .venv/.installed ]; then
  pip install --upgrade pip
  pip install torch --index-url https://download.pytorch.org/whl/cpu
  pip install -r requirements.txt
  touch .venv/.installed
fi
[ -f models/food_yolov11.pt ] || echo "NOTE: models/food_yolov11.pt missing — /api/analyze will report the model as unavailable. See models/README.md"
exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload
