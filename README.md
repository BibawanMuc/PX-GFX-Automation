# GFX Automation Dashboard

This project is a Next.js dashboard for automating After Effects rendering jobs using Python and ExtendScript.

## Project Structure

-   `src/app/api/render/route.ts`: Main API endpoint that triggers the automation.
-   `scripts/launcher.py`: The Python script that orchestrates the AE launch and script execution.
-   `scripts/px_automate.jsx`: The ExtendScript that runs inside After Effects to process the job.
-   `scripts/debug/`: Contains various test scripts used during development to verify AE launching.
-   `tmp/`: Stores temporary job files (`.txt`, `.bat`, `.jsx`) generated during runtime.

## Setup Requirements

### 1. After Effects Configuration (CRITICAL)
You must enable script access in After Effects for the automation to work:
1.  Open After Effects.
2.  Go to **Edit** > **Preferences** > **Scripting & Expressions**.
3.  **CHECK** the box: **"Allow Scripts to Write Files and Access Network"**.
4.  Restart After Effects.

### 2. Python Environment
Ensure Python 3.x is installed and added to your system PATH.
The automation relies on the standard libraries (`os`, `sys`, `subprocess`, `shutil`, `time`).
If you need specific packages, install them via:
```bash
pip install -r requirements.txt # (If present)
```

### 3. Environment Variables (.env.local)
The dashboard requires the following variables:
-   `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL.
-   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
-   `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key for backend updates.
-   `AE_BINARY_PATH`: Full path to `AfterFX.exe`.
-   `AE_PROJECT_FILE`: Full path to the Master Project (`.aep`).

## Troubleshooting & "The Spaces Issue"

### Problem: Silent Failure on Launch
During development, we discovered that **After Effects has a critical bug/limitation** when launching scripts from the command line if the file path contains **double spaces** or is excessively long/complex (e.g., `.../260127 GFX  Automations/...`). Even with correct quoting, AE fails to parse the arguments and simply launches without running the script.

### Solution: The "Temp File Copy" Strategy
To fix this robustly, `launcher.py` implements a specific workaround:
1.  It takes the complex path of the script (e.g., `d:\PX KI Event\...\px_automate.jsx`).
2.  It **COPIES** this script to a temporary, simple location at the root of the drive: `d:\_temp_exec.jsx`.
3.  It instructs After Effects to run `d:\_temp_exec.jsx`.

This eliminates all path complexity, ensuring 100% reliable execution regardless of the project folder name.

### Debugging
If automation fails:
1.  Check `dashboard/scripts/launcher_debug.log` for Python execution logs.

## Git Workflow & Troubleshooting

To update the repository correctly, especially when checking in large binary files or after automation runs:

1.  **Sequential Commands:** Do not chain commands with `&&` in PowerShell. Run them one by one.
2.  **Lock Files:** If `git commit` fails with an `index.lock` error, the previous command didn't release the lock fast enough.
    *   **Fix:** Run `del .git\index.lock` manually.
3.  **Recommended Sequence:**
    ```powershell
    git status
    git add .
    git commit -m "your message"
    git push
    ```
4.  **Tracked Paths:**
    *   `_AE Projekte/`: Fully tracked (includes .aep files).
    *   `_Renderings/`: Only the folder is tracked. Content is ignored to prevent repo bloat.
