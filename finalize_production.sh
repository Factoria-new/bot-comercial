#!/bin/bash

echo ">>> [1/3] Updating Backend Configuration..."
# Update FRONTEND_URL in backend/.env
# We use | as delimiter to handling slashes in URL
sed -i 's|FRONTEND_URL=http://localhost:5173/|FRONTEND_URL=https://cajiassist.com/|g' ~/cajiassist/backend/.env
sed -i 's|FRONTEND_URL=http://localhost:5173|FRONTEND_URL=https://cajiassist.com|g' ~/cajiassist/backend/.env

echo ">>> [2/3] Configuring Frontend Environment..."
# Create .env for frontend build
echo "VITE_API_URL=https://api.cajiassist.com" > ~/cajiassist/frontend/.env

echo ">>> [3/3] Rebuilding Frontend & Restarting Services..."
# Rebuild Frontend
cd ~/cajiassist/frontend
npm install # Ensure deps are there
npm run build
# Deploy new build
sudo cp -r dist/* /var/www/cajiassist/frontend/dist/

# Restart Backend to pick up .env changes
pm2 restart caji-backend

echo "✅ Production Configuration Updated!"
