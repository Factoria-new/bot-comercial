# Deploy Script for CajiAssist
$ErrorActionPreference = "Stop"

$pem = "C:\Users\Bruno Porto\.ssh\botbora.pem"
$host_ip = "54.204.51.236"
$user = "ubuntu"
$remote_dir = "~/cajiassist"

Write-Host ">>> STARTING DEPLOYMENT TO $host_ip..."

# 1. Clean previous build
if (Test-Path deploy_pkg) { Remove-Item deploy_pkg -Recurse -Force }
if (Test-Path deploy.zip) { Remove-Item deploy.zip -Force }

# 2. Prepare Package
Write-Host ">>> preparing package (using robocopy)..."
New-Item -ItemType Directory -Force -Path deploy_pkg | Out-Null

# Use Robocopy for speed (exclude node_modules)
robocopy backend deploy_pkg\backend /E /XD node_modules .git dist coverage /nfl /ndl
if ($LASTEXITCODE -ge 8) { throw "Robocopy failed backend" }

robocopy frontend deploy_pkg\frontend /E /XD node_modules .git dist coverage /nfl /ndl
if ($LASTEXITCODE -ge 8) { throw "Robocopy failed frontend" }

robocopy ai_engine deploy_pkg\ai_engine /E /XD __pycache__ .git .venv /nfl /ndl
if ($LASTEXITCODE -ge 8) { throw "Robocopy failed ai_engine" }

Copy-Item cajiassist.nginx.conf deploy_pkg\
Copy-Item server_setup.sh deploy_pkg\

# 3. Zip Package
Write-Host ">>> zipping files..."
Compress-Archive -Path deploy_pkg\* -DestinationPath deploy.zip -Force

# 4. Upload to Server
Write-Host ">>> uploading to server (this may take a minute)..."
scp -i "$pem" -o StrictHostKeyChecking=no deploy.zip "${user}@${host_ip}:~/deploy.zip"

# 5. Execute Setup on Server
Write-Host ">>> executing remote setup..."
ssh -i "$pem" -o StrictHostKeyChecking=no "${user}@${host_ip}" "unzip -o ~/deploy.zip -d ~/cajiassist && chmod +x ~/cajiassist/server_setup.sh && ~/cajiassist/server_setup.sh"

Write-Host ">>> DEPLOYMENT FINISH SUCCESFULLY!"
