@echo off
chcp 65001 > nul
echo ========================================
echo 🔐 INSTALANDO SSL - NOVA INSTÂNCIA
echo ========================================
echo.

set SERVER_HOST=ec2-54-227-116-28.compute-1.amazonaws.com
set SSH_KEY=C:\Users\Porto\.ssh\factoria.pem
set REMOTE_USER=ubuntu

set /p EMAIL="Digite seu email para o certificado SSL: "

echo.
echo 🔐 Instalando certificado SSL...
echo.

ssh -i "%SSH_KEY%" %REMOTE_USER%@%SERVER_HOST% "sudo certbot --nginx -d bora.factoriasolutions.com --non-interactive --agree-tos -m %EMAIL%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ SSL instalado com sucesso!
    echo 🔗 Acesse: https://bora.factoriasolutions.com/api/status
    echo.
) else (
    echo.
    echo ❌ Erro ao instalar SSL
    echo.
    echo Verifique se:
    echo 1. O DNS está propagado corretamente
    echo 2. O domínio aponta para o IP 54.227.116.28
    echo 3. As portas 80 e 443 estão abertas no Security Group da AWS
    echo.
)

pause

