import sys
import os
import subprocess
import logging

def main():
    print("---------------------------------------------------")
    print("TEST LAUNCHER - UNIFIED STRATEGY")
    
    ae_binary = r"C:\Program Files\Adobe\Adobe After Effects 2026\Support Files\AfterFX.exe"
    script_path = r"d:\PX KI Event\PROJECT\CODE\GFX_LINK\CODE3\dashboard\scripts\test_unified.jsx"

    print(f"AE Binary: {ae_binary}")
    print(f"Script: {script_path}")

    # SINGLE COMMAND: Launch AE and run script immediately
    # The script handles opening the project.
    
    cmd_command = f'"{ae_binary}" -r "{script_path}"'
    
    print("\n[Step 1] Executing Single Command...")
    print(f"Command: {cmd_command}")
    
    # We use Popen so we don't block
    subprocess.Popen(f'"{ae_binary}" -r "{script_path}"')
    
    print("\nCommand sent. Check After Effects!")

if __name__ == "__main__":
    main()
