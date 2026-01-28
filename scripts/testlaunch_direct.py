import os
import subprocess
import time

def main():
    print("---------------------------------------------------")
    print("TEST LAUNCHER - DIRECT SUBPROCESS (FIXED)")
    
    script_path = r"d:\simple.jsx"
    ae_dir = r"C:\Program Files\Adobe\Adobe After Effects 2026\Support Files"
    ae_binary = "AfterFX.exe"
    
    # FIX: Use full path to executable
    ae_full_path = os.path.join(ae_dir, ae_binary)

    print(f"AE Path: {ae_full_path}")
    print(f"Script: {script_path}")

    # DIRECT EXECUTION
    # Using full path to executable
    
    cmd = [ae_full_path, "-r", script_path]
    
    print(f"\nrunning subprocess: {cmd}")
    
    try:
        # We still set cwd just in case AE needs it for dll loading
        proc = subprocess.Popen(cmd, cwd=ae_dir)
        print(f"Process launched with PID: {proc.pid}")
        print("Check AE now!")
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    main()
