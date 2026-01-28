import sys
import os
import subprocess
import time

def main():
    print("---------------------------------------------------")
    print("TEST LAUNCHER - ROOT PATH STRATEGY")
    
    # 1. SIMPLE PATH
    # We copied the script to D:\test_ae.jsx to eliminate ALL space/length issues
    script_path = r"d:\test_ae.jsx"
    ae_binary_dir = r"C:\Program Files\Adobe\Adobe After Effects 2026\Support Files"
    ae_binary = r"AfterFX.exe"

    print(f"Script: {script_path}")

    # 2. TRIGGER COMMAND
    cmd_command = f'start "AE Root Test" cmd /k "cd /d "{ae_binary_dir}" && {ae_binary} -r "{script_path}""'
    
    print("\n[Step 1] Triggering via Root Path...")
    print(f"Command: {cmd_command}")
    
    os.system(cmd_command)
    
    print("\nCheck the Pop-up Window and AE!")

if __name__ == "__main__":
    main()
