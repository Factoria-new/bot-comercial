import os
import zipfile
import subprocess
import sys
import time

# CONFIGURATION
PEM_KEY = r"C:\Users\Bruno Porto\.ssh\botbora.pem"
HOST_IP = "54.204.51.236"
USER = "ubuntu"
REMOTE_DIR = "~/cajiassist"
ZIP_NAME = "deploy_release.zip"

DIRS_TO_INCLUDE = ["backend", "frontend", "ai_engine"]
FILES_TO_INCLUDE = ["cajiassist.nginx.conf", "server_setup.sh"]
EXCLUDE_DIRS = ["node_modules", ".git", "dist", "coverage", "__pycache__", ".venv", "deploy_pkg"]
EXCLUDE_EXTENSIONS = [".log", ".zip", ".rar"]

def zip_project():
    print(">>> [1/3] Zipping files...")
    if os.path.exists(ZIP_NAME):
        os.remove(ZIP_NAME)

    with zipfile.ZipFile(ZIP_NAME, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Add individual files
        for file in FILES_TO_INCLUDE:
            if os.path.exists(file):
                print(f"Adding file: {file}")
                zipf.write(file, file)
            else:
                print(f"Warning: File {file} not found!")

        # Add directories
        for dir_name in DIRS_TO_INCLUDE:
            if not os.path.exists(dir_name):
                print(f"Warning: Directory {dir_name} not found!")
                continue

            print(f"Adding directory: {dir_name}...")
            for root, dirs, files in os.walk(dir_name):
                # Modify dirs in-place to skip excluded directories
                dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
                
                for file in files:
                    if any(file.endswith(ext) for ext in EXCLUDE_EXTENSIONS):
                        continue
                    
                    file_path = os.path.join(root, file)
                    zipf.write(file_path, file_path)
    
    size_mb = os.path.getsize(ZIP_NAME) / (1024 * 1024)
    print(f">>> Zip created: {ZIP_NAME} ({size_mb:.2f} MB)")

def upload_and_exec():
    print(f">>> [2/3] Uploading block to {HOST_IP} (using SCP)...")
    
    scp_cmd = [
        "scp",
        "-i", PEM_KEY,
        "-o", "StrictHostKeyChecking=no",
        ZIP_NAME,
        f"{USER}@{HOST_IP}:~/{ZIP_NAME}"
    ]
    
    if subprocess.call(scp_cmd) != 0:
        print("❌ Error: SCP upload failed.")
        return

    print(">>> [3/3] Executing Setup on Server (SSH)...")
    
    # Remote commands to run
    # Remote commands to run
    remote_cmds = [
        "sudo apt update",
        "sudo apt install -y unzip",
        f"unzip -o ~/{ZIP_NAME} -d {REMOTE_DIR}",
        f"chmod +x {REMOTE_DIR}/server_setup.sh",
        f"{REMOTE_DIR}/server_setup.sh"
    ]
    full_remote_cmd = " && ".join(remote_cmds)

    ssh_cmd = [
        "ssh",
        "-i", PEM_KEY,
        "-o", "StrictHostKeyChecking=no",
        f"{USER}@{HOST_IP}",
        full_remote_cmd
    ]

    subprocess.call(ssh_cmd)

if __name__ == "__main__":
    try:
        zip_project()
        upload_and_exec()
        print("\n✅ DEPLOYMENT FINISHED!")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        input("Press Enter to exit...")
