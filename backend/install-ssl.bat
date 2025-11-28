@echo off
chcp 65001 > nul
echo ========================================
echo 🔐 INSTALANDO SSL - CERTBOT
echo ========================================
echo.

set /p EMAIL="Digite seu email para o certificado SSL: "

echo.
echo 🔐 Instalando certificado SSL para bora.factoriasolutions.com...
echo.

ssh -i "C:\Users\Porto\.ssh\factoria.pem" ubuntu@ec2-54-227-116-28.compute-1.amazonaws.com "sudo certbot --nginx -d bora.factoriasolutions.com --non-interactive --agree-tos -m %EMAIL%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ SSL instalado com sucesso!
    echo.
    echo 🔗 Teste o backend:
    echo    https://bora.factoriasolutions.com/api/status
    echo.
) else (
    echo.
    echo ❌ Erro ao instalar SSL
    echo.
    echo Verifique se:
    echo 1. O DNS propagou corretamente (nslookup bora.factoriasolutions.com)
    echo 2. O domínio aponta para o IP 54.227.116.28
    echo 3. As portas 80 e 443 estão abertas no Security Group da AWS
    echo.
)

pause

