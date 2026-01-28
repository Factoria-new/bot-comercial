#!/bin/bash

# Exit on any error
set -e

# Configuration
# TODO: Update this path to your local .pem file
PEM_FILE="~/Documents/botbora.pem"
HOST_IP="54.204.51.236"
USER="ubuntu"
REMOTE_DIR="~/cajiassist"

echo ">>> STARTING DEPLOYMENT TO $HOST_IP..."

# 1. Clean previous build
echo ">>> cleaning previous build..."
rm -rf deploy_pkg deploy.zip

# 2. Prepare Package
echo ">>> preparing package..."
mkdir -p deploy_pkg

# Use rsync for speed (exclude unwanted directories)
# backend
rsync -av --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='coverage' backend/ deploy_pkg/backend/

# frontend
rsync -av --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='coverage' frontend/ deploy_pkg/frontend/

# ai_engine
rsync -av --exclude='__pycache__' --exclude='.git' --exclude='.venv' --exclude='venv' ai_engine/ deploy_pkg/ai_engine/

# root files
cp cajiassist.nginx.conf deploy_pkg/
cp server_setup.sh deploy_pkg/

# 3. Zip Package
echo ">>> zipping files..."
cd deploy_pkg
zip -r ../deploy.zip .
cd ..

# 4. Upload to Server
echo ">>> uploading to server (this may take a minute)..."
scp -i "$PEM_FILE" -o StrictHostKeyChecking=no deploy.zip "${USER}@${HOST_IP}:~/deploy.zip"

# 5. Execute Setup on Server
echo ">>> executing remote setup..."
ssh -i "$PEM_FILE" -o StrictHostKeyChecking=no "${USER}@${HOST_IP}" "unzip -o ~/deploy.zip -d ~/cajiassist && chmod +x ~/cajiassist/server_setup.sh && ~/cajiassist/server_setup.sh"

echo ">>> DEPLOYMENT FINISHED SUCCESSFULLY!"
