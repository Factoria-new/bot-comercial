@echo off
chcp 65001 > nul
echo ========================================
echo 🚀 DEPLOY BACKEND - NOVA INSTÂNCIA AWS
echo ========================================
echo.

set SERVER_HOST=ec2-54-227-116-28.compute-1.amazonaws.com
set SSH_KEY=C:\Users\Porto\.ssh\factoria.pem
set REMOTE_USER=ubuntu
set REMOTE_DIR=~/bot-bora-backend
set APP_NAME=bot-bora-backend
set PORT=3003

echo 📦 Passo 1/6: Comprimindo arquivos do backend...
echo.
powershell -ExecutionPolicy Bypass -File compress.ps1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro ao comprimir arquivos
    pause
    exit /b 1
)

echo.
echo 📤 Passo 2/6: Enviando arquivos para o servidor...
echo.
scp -i "%SSH_KEY%" ..\backend-deploy.zip %REMOTE_USER%@%SERVER_HOST%:~/
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro ao enviar arquivos
    pause
    exit /b 1
)

echo.
echo 📤 Enviando arquivo .env...
echo.
scp -i "%SSH_KEY%" .env %REMOTE_USER%@%SERVER_HOST%:~/
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️ Aviso: Erro ao enviar .env (pode não existir)
)

echo.
echo 🔧 Passo 3/6: Instalando Node.js e dependências...
echo.
ssh -i "%SSH_KEY%" %REMOTE_USER%@%SERVER_HOST% "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs unzip && node --version && npm --version"
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro ao instalar Node.js
    pause
    exit /b 1
)

echo.
echo 📂 Passo 4/6: Extraindo e configurando backend...
echo.
ssh -i "%SSH_KEY%" %REMOTE_USER%@%SERVER_HOST% "rm -rf %REMOTE_DIR% && mkdir -p %REMOTE_DIR% && unzip -o ~/backend-deploy.zip -d %REMOTE_DIR% && cd %REMOTE_DIR% && npm install --production"
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro ao configurar backend
    pause
    exit /b 1
)

echo.
echo 🔐 Configurando arquivo .env...
echo.
ssh -i "%SSH_KEY%" %REMOTE_USER%@%SERVER_HOST% "mv ~\.env %REMOTE_DIR%/.env 2>/dev/null || echo 'PORT=%PORT%' > %REMOTE_DIR%/.env && echo 'FRONTEND_URL=https://bot-bora.vercel.app' >> %REMOTE_DIR%/.env"

echo.
echo 🚀 Passo 5/6: Configurando PM2...
echo.
ssh -i "%SSH_KEY%" %REMOTE_USER%@%SERVER_HOST% "sudo npm install -g pm2 && cd %REMOTE_DIR% && pm2 delete %APP_NAME% 2>/dev/null || true && pm2 start src/server.js --name %APP_NAME% && pm2 save && pm2 startup | tail -n 1 | sudo bash || true"
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro ao configurar PM2
    pause
    exit /b 1
)

echo.
echo 🌐 Passo 6/6: Configurando Nginx e SSL...
echo.

REM Criar arquivo de configuração do Nginx
ssh -i "%SSH_KEY%" %REMOTE_USER%@%SERVER_HOST% "sudo apt-get update && sudo apt-get install -y nginx certbot python3-certbot-nginx"

echo.
echo 📝 Aguarde enquanto configuramos o Nginx...
echo.

ssh -i "%SSH_KEY%" %REMOTE_USER%@%SERVER_HOST% "sudo tee /etc/nginx/sites-available/bot-bora > /dev/null << 'EOF'
server {
    listen 80;
    server_name bora.factoriasolutions.com;

    # Logs
    access_log /var/log/nginx/bot-bora-access.log;
    error_log /var/log/nginx/bot-bora-error.log;

    # Proxy para o backend
    location / {
        proxy_pass http://localhost:%PORT%;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # WebSocket support
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
}
EOF"

ssh -i "%SSH_KEY%" %REMOTE_USER%@%SERVER_HOST% "sudo ln -sf /etc/nginx/sites-available/bot-bora /etc/nginx/sites-enabled/ && sudo nginx -t && sudo systemctl restart nginx"

echo.
echo ✅ Deploy concluído com sucesso!
echo.
echo 📊 Status do PM2:
ssh -i "%SSH_KEY%" %REMOTE_USER%@%SERVER_HOST% "pm2 status"

echo.
echo 🌐 Próximos passos:
echo 1. Configure o DNS para apontar bora.factoriasolutions.com para o IP: 54.227.116.28
echo 2. Após a propagação do DNS, rode o comando para instalar SSL:
echo    ssh -i "%SSH_KEY%" ubuntu@%SERVER_HOST% "sudo certbot --nginx -d bora.factoriasolutions.com --non-interactive --agree-tos -m seu-email@exemplo.com"
echo.
echo 🔗 Acesse: http://54.227.116.28:3003/api/status
echo.
pause

