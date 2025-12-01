#!/bin/bash
set -e

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

echo "--- Lights Collector Installer ---"
echo "Installing in: $SCRIPT_DIR"

# 1. Setup Virtual Environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
else
    echo "Virtual environment already exists."
fi

# 2. Install Requirements
echo "Installing requirements..."
./venv/bin/pip install -r requirements.txt

# 3. Setup Configuration (.env)
if [ ! -f ".env" ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "IMPORTANT: Please edit 'device/.env' and 'device/credentials.json' with your real configuration before starting the service."
else
    echo ".env already exists. Skipping."
fi

# 4. Generate Systemd Service File
SERVICE_NAME="lights-collector.service"
TEMPLATE_FILE="lights-collector.service.template"
TARGET_SERVICE_FILE="/tmp/$SERVICE_NAME"

echo "Generating systemd service file..."
CURRENT_USER=$(whoami)
CURRENT_GROUP=$(id -gn)
VENV_PYTHON="$SCRIPT_DIR/venv/bin/python"

sed -e "s|{{USER}}|$CURRENT_USER|g" \
    -e "s|{{GROUP}}|$CURRENT_GROUP|g" \
    -e "s|{{WORKDIR}}|$SCRIPT_DIR|g" \
    -e "s|{{VENV_PYTHON}}|$VENV_PYTHON|g" \
    "$TEMPLATE_FILE" > "$TARGET_SERVICE_FILE"

echo "Generated service file at $TARGET_SERVICE_FILE"

# 5. Install Systemd Service
echo "Installing systemd service..."
sudo mv "$TARGET_SERVICE_FILE" "/etc/systemd/system/$SERVICE_NAME"
sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE_NAME"

echo "--- Installation Complete ---"
echo "1. Edit '$SCRIPT_DIR/.env' with your device URL and settings."
echo "2. Place your Google Service Account JSON in '$SCRIPT_DIR/credentials.json' (or update .env)."
echo "3. Start the service with: sudo systemctl start $SERVICE_NAME"
echo "4. Check status with: sudo systemctl status $SERVICE_NAME"
