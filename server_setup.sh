#!/bin/bash

# CAJIASSIST SERVER SETUP SCRIPT
# This script is uploaded to the server and executed to configure everything.

# 1. Update & Install System Dependencies
echo ">>> [1/6] Installing System Dependencies (Node, Python, Nginx)..."
sudo apt update
sudo apt install -y nodejs npm python3-pip python3-venv nginx certbot python3-certbot-nginx unzip

# Install PM2 Global
sudo npm install -g pm2

# 2. Setup Project Directory
echo ">>> [2/6] Setting up Directory..."
mkdir -p ~/cajiassist
# (Files are already unzipped here by deploy.ps1)

# 3. Backend Setup
echo ">>> [3/6] Installing Backend..."
cd ~/cajiassist/backend
npm install
npx prisma generate
cd ..

# 4. Frontend Setup
echo ">>> [4/6] Installing Frontend..."
cd frontend
npm install
npm run build
# Deploy to /var/www
echo ">>> Deploying Frontend to /var/www/cajiassist..."
sudo mkdir -p /var/www/cajiassist/frontend/dist
sudo cp -r dist/* /var/www/cajiassist/frontend/dist/
# Fix permissions
sudo chown -R www-data:www-data /var/www/cajiassist
sudo chmod -R 755 /var/www/cajiassist
cd ..

# 5. AI Engine Setup
echo ">>> [5/6] Installing AI Engine..."
cd ai_engine
# Install python requirements
pip3 install -r requirements.txt --break-system-packages
cd ..

# 6. Nginx Configuration
echo ">>> [6/6] Configuring Nginx..."
sudo cp cajiassist.nginx.conf /etc/nginx/sites-available/cajiassist
sudo ln -sf /etc/nginx/sites-available/cajiassist /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
# Test and Restart Nginx
sudo nginx -t
sudo systemctl restart nginx

# 7. Start Services with PM2
echo ">>> [PM2] Starting Services..."
# Backend
cd backend
pm2 delete caji-backend 2>/dev/null || true
pm2 start src/server.js --name "caji-backend"
cd ..

# AI Engine
cd ai_engine
pm2 delete caji-ai 2>/dev/null || true
pm2 start main.py --interpreter python3 --name "caji-ai"
cd ..

# Save PM2 list
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu

echo ">>> DEPLOYMENT COMPLETE! 🚀"
echo ">>> Access your site at http://cajiassist.com"
