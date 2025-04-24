#!/bin/bash

# Crée le venv s’il n’existe pas
if [ ! -d "venv" ]; then
  python3 -m venv venv
fi

# Active le venv
source venv/bin/activate


pip install -r requirements.txt

# Lance le serveur FastAPI
python api.py