import sys
import os
import time
import subprocess
import logging
import shutil

# Setup file logging
log_file = os.path.join(os.path.dirname(__file__), 'launcher_debug.log')
logging.basicConfig(
    filename=log_file,
    level=logging.INFO,
    format='%(asctime)s - %(message)s'
)

def main():
    logging.info("---------------------------------------------------")
    logging.info("Launcher started (Root Copy Strategy).")
    
    if len(sys.argv) < 4:
        msg = "Usage: python launcher.py <ae_binary> <project_path> <script_path>"
        print(msg)
        logging.error(msg)
        sys.exit(1)

    ae_binary = sys.argv[1]
    project_path = sys.argv[2]
    original_script_path = sys.argv[3]

    logging.info(f"AE Binary: {ae_binary}")
    logging.info(f"Project: {project_path}")
    logging.info(f"Original Script: {original_script_path}")

    # FORCE PATH SIMPLIFICATION
    # AE is failing on the complex path "d:\PX KI Event...".
    # We copying the script to d:\_temp_exec_TIMESTAMP.jsx to mimic the working "simple.jsx" test.
    # We use a unique name to avoid file-lock collisions between runs.
    
    timestamp = int(time.time())
    temp_script_path = fr"d:\_temp_exec_{timestamp}.jsx"
    
    try:
        shutil.copy2(original_script_path, temp_script_path)
        logging.info(f"Copied script to SAFE path: {temp_script_path}")
    except Exception as e:
        logging.error(f"Failed to copy script to temp path: {e}")
        sys.exit(1)

    # 0. CLEANUP: Ensure no zombie AE processes are running
    # This prevents the new instance from messaging an old/closing instance.
    logging.info("Step 0: Cleaning up old AfterFX processes...")
    try:
        subprocess.run(["taskkill", "/F", "/IM", "AfterFX.exe"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(2) # Give Windows a moment to release file locks
        logging.info("Old AfterFX processes killed (if any).")
    except Exception:
        pass

    # 1. Launch After Effects with Project
    logging.info("Step 1: Launching After Effects...")
    try:
        # Note: We launch DETACHED so we don't hold the process open
        proc = subprocess.Popen([ae_binary, "-project", project_path])
        logging.info(f"AE launched with PID: {proc.pid}")
    except Exception as e:
        logging.error(f"Failed to launch AE: {e}")

    # 2. Wait for initialization
    # Reduced to 30s as per user request (was 35s)
    logging.info("Step 2: Waiting 30 seconds for AE to initialize...")
    time.sleep(30)

    # 3. Trigger Script via Direct Popen using TEMP PATH
    logging.info(f"Step 3: Triggering script...")
    
    ae_dir = os.path.dirname(ae_binary)
    
    # Use the TEMP path
    cmd = [ae_binary, "-r", temp_script_path]
    logging.info(f"Command: {cmd}")
    logging.info(f"CWD: {ae_dir}")
    
    try:
        proc = subprocess.Popen(cmd, cwd=ae_dir)
        logging.info(f"Trigger process launched with PID: {proc.pid}")
        logging.info("Script sent to After Effects.")
    except Exception as e:
        logging.error(f"Failed to trigger script: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
