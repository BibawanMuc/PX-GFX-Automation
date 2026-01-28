# AI Session Handoff & Project Status

**Date:** 28.01.2026
**Status:** Functional Beta

## 🚀 Quick Start
1.  **Start Dashboard:** `npm run dev`
2.  **Start Watcher:** `npm run watcher` (New!)

## ✅ Completed Features
*   **Batch Automation:** Full AE render pipeline working (Select Days -> Generate Jobs -> Render).
*   **Deep Duplication:** Logic in `px_automate.jsx` prevents layer ghosting.
*   **Launcher:** Python script (`launcher.py`) handles AE process management and "double space" path bugs.
*   **Watch Folder:** Automatically marks jobs as "Done" when files appear in `_Renderings`.
*   **Open File:** Clicking "Done" jobs opens the video file.

## 📂 Key Files
*   `src/components/InputForm.tsx`: UI for job creation.
*   `src/components/JobHistory.tsx`: UI for job list & status logic.
*   `scripts/watch_renderings.js`: Node script for file monitoring.
*   `scripts/px_automate.jsx`: The core After Effects script.

## 📝 Next Steps / Backlog
*   [ ] User requested "Done" icon (Implemented).
*   [ ] Open file on click (Implemented).
*   *[Future]*: Progress bar for rendering?
*   *[Future]*: Multi-machine rendering?

## ⚠️ Important Notes
*   **AE Settings:** Ensure "Allow Scripts to Write Files" is ON in After Effects.
*   **Paths:** The system uses `_Renderings` in the dashboard root. Do not change folder structure without updating `watcher` and `launcher`.
