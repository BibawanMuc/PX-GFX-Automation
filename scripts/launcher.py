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

    # Define status file
    dashboard_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    status_file = os.path.join(dashboard_dir, 'tmp', 'system_status.json')
    
    def update_status(status, msg=""):
        try:
            import json
            with open(status_file, 'w') as f:
                json.dump({"status": status, "message": msg, "timestamp": time.time()}, f)
        except Exception as e:
            logging.error(f"Failed to update status: {e}")

    update_status("starting", "Initializing Launcher...")

    ae_binary = sys.argv[1]
    project_path = sys.argv[2]
    original_script_path = sys.argv[3]

    logging.info(f"AE Binary: {ae_binary}")
    logging.info(f"Project: {project_path}")
    logging.info(f"Original Script: {original_script_path}")

    # FORCE PATH SIMPLIFICATION
    timestamp = int(time.time())
    temp_script_path = fr"d:\_temp_exec_{timestamp}.jsx"
    
    try:
        shutil.copy2(original_script_path, temp_script_path)
        logging.info(f"Copied script to SAFE path: {temp_script_path}")
    except Exception as e:
        logging.error(f"Failed to copy script to temp path: {e}")
        update_status("error", f"Script copy failed: {e}")
        sys.exit(1)

    # 0. CLEANUP
    logging.info("Step 0: Cleaning up old AfterFX processes...")
    try:
        subprocess.run(["taskkill", "/F", "/IM", "AfterFX.exe"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(2)
        logging.info("Old AfterFX processes killed (if any).")
    except Exception:
        pass

    # 1. Launch After Effects with Project
    logging.info("Step 1: Launching After Effects...")
    ae_proc = None
    try:
        # Launch using Popen and KEEP handle
        ae_proc = subprocess.Popen([ae_binary, "-project", project_path])
        logging.info(f"AE launched with PID: {ae_proc.pid}")
        update_status("running", "After Effects is running...")
    except Exception as e:
        logging.error(f"Failed to launch AE: {e}")
        update_status("error", f"AE Launch failed: {e}")
        sys.exit(1)

    # 2. Wait for initialization
    logging.info("Step 2: Waiting 30 seconds for AE to initialize...")
    time.sleep(30)

    # 3. Trigger Script
    logging.info(f"Step 3: Triggering script...")
    ae_dir = os.path.dirname(ae_binary)
    cmd = [ae_binary, "-r", temp_script_path]
    
    try:
        # This triggers the script in the EXISTING process
        subprocess.Popen(cmd, cwd=ae_dir)
        logging.info("Script sent to After Effects.")
        update_status("rendering", "Script execution started...")
    except Exception as e:
        logging.error(f"Failed to trigger script: {e}")
        # Don't exit, AE is still running
    
    # 4. MONITOR AND WAIT
    logging.info("Step 4: Waiting for After Effects to close...")
    if ae_proc:
        try:
            ae_proc.wait() # BLOCKS until AE quits
            logging.info("After Effects has closed.")
            update_status("stopped", "Render Session Finished")
        except Exception as e:
            logging.error(f"Error waiting for AE: {e}")
    
    # Cleanup temp script
    try:
        if os.path.exists(temp_script_path):
            os.remove(temp_script_path)
    except:
        pass

if __name__ == "__main__":
    main()
