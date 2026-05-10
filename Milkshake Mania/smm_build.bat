@echo off
cls

echo.
echo [BUILD] Building the game...
echo.

cmd /c npm run build

echo.
echo [DONE] Build complete (web).
echo.

echo [BUILD] Building the executable...
echo.

if exist build rmdir /s /q build

pyinstaller --onefile --windowed --name "MilkshakeMania" --icon "assets/favicon.ico" --add-data "dist;dist" ^
--add-data "assets;assets" --collect-all bottle --clean --distpath build smm.py

echo.
echo Build complete! Executable is located in the "build" folder.
echo.

pause
