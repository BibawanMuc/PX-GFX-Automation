import sys
import os
import subprocess
import time

def main():
    print("---------------------------------------------------")
    print("TEST LAUNCHER - SUBST DRIVE STRATEGY")
    
    # 1. PATHS using X: DRIVE
    # "d:\PX KI Event\PROJECT\CODE\260127 GFX  Automations" is mapped to X:\
    # So "CODE3\dashboard\..." becomes "X:\CODE3\dashboard\..."
    
    script_path = r"X:\CODE3\dashboard\scripts\test_unified.jsx"
    ae_binary_dir = r"C:\Program Files\Adobe\Adobe After Effects 2026\Support Files"
    ae_binary = r"AfterFX.exe" # Rely on CD being correct

    print(f"Script (Virtual Path): {script_path}")

    # 2. TRIGGER COMMAND
    # We cd into AE dir, then run AfterFX without path, just the filename
    # This matches the user's working pxAutomateAE.py exactly
    
    # Note: We use /c to close window if successful, or /k to keep open?
    # Let's use /k for debug visibility.
    
    cmd_command = f'start "AE Trigger Subst" cmd /k "cd /d "{ae_binary_dir}" && {ae_binary} -r "{script_path}""'
    
    print("\n[Step 1] Triggering via Virtual Drive...")
    print(f"Command: {cmd_command}")
    
    os.system(cmd_command)
    
    print("\nCheck the Pop-up Window and AE!")

if __name__ == "__main__":
    main()
