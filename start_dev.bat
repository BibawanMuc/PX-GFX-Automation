@echo off
title PX GFX Automation Launcher
echo HOSTNAME: %COMPUTERNAME%
echo TIME: %TIME%
echo ------------------------------------------
echo Starting PX GUI (Next.js) + Watcher Service
echo ------------------------------------------

:: Start Next.js Dev Server
start "PX Dashboard (Frontend)" cmd /k "npm run dev"

:: Start Backend Watcher
start "PX Watcher (Backend)" cmd /k "npm run watcher"

echo Services started in new windows.
echo You can close this window.
timeout /t 5
