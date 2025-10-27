@echo off
echo Clearing all caches and restarting development server...

cd frontend

echo.
echo [1/5] Stopping any running dev servers...
taskkill /F /IM node.exe 2>nul

echo [2/5] Removing Vite cache...
if exist "node_modules\.vite" rd /s /q "node_modules\.vite"

echo [3/5] Removing dist folder...
if exist "dist" rd /s /q "dist"

echo [4/5] Removing any remaining .js files in hooks...
if exist "src\hooks\useSocket.js" del /f /q "src\hooks\useSocket.js"

echo [5/5] Starting development server...
echo.
echo ========================================
echo Please do the following in your browser:
echo 1. Open Developer Tools (F12)
echo 2. Right-click the refresh button
echo 3. Select "Empty Cache and Hard Reload"
echo 4. OR press Ctrl+Shift+Delete and clear cache
echo ========================================
echo.

npm run dev

