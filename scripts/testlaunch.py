import sys
import os
import time
import subprocess

def main():
    print("---------------------------------------------------")
    print("TEST LAUNCHER - BATCH FILE GEN START")
    
    # HARDCODED PATHS
    ae_binary_dir = r"C:\Program Files\Adobe\Adobe After Effects 2026\Support Files"
    script_path = r"d:\PX KI Event\PROJECT\CODE\GFX_LINK\CODE3\dashboard\scripts\px_automate.jsx"

    print(f"AE Dir: {ae_binary_dir}")
    print(f"Script: {script_path}")

    # Generate a simple batch file to handle the trigger
    # This avoids all the Python -> CMD -> Quoting madness
    bat_path = os.path.join(os.getcwd(), "debug_trigger.bat")
    
    bat_content = f"""@echo off
echo Debug Trigger Started...
echo.
echo Changing directory to AE folder...
cd /d "{ae_binary_dir}"

echo.
echo Triggering Script...
AfterFX.exe -r "{script_path}"

echo.
echo Done. Pause to check output...
pause
"""
    
    with open(bat_path, "w") as f:
        f.write(bat_content)
        
    print(f"\nGenerated: {bat_path}")
    print("Running it now...")
    
    os.system(f'start "" "{bat_path}"')

if __name__ == "__main__":
    main()
