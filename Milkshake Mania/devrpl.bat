@echo off
setlocal EnableDelayedExpansion

:: =========================
:: ANSI Escape Setup
:: =========================

for /F %%a in ('echo prompt $E ^| cmd') do set "ESC=%%a"

set "RESET=%ESC%[0m"
set "RED=%ESC%[91m"
set "GREEN=%ESC%[92m"
set "YELLOW=%ESC%[93m"
set "BLUE=%ESC%[94m"
set "MAGENTA=%ESC%[95m"
set "CYAN=%ESC%[96m"
set "WHITE=%ESC%[97m"

title Strider657's Milkshake Mania Launcher

:: Check for arguments
set "arg=%~1"
set "auto_exit=0"

if "!arg!"=="-1" set "auto_exit=1" & goto run_desktop
if "!arg!"=="-2" set "auto_exit=1" & goto run_web
if "!arg!"=="-3" set "auto_exit=1" & goto build
if "!arg!"=="-4" goto exit_

:menu
cls
echo.
echo %MAGENTA%============================================================%RESET%
echo %CYAN%      Strider657's Milkshake Mania (SMM) - Development REPL%RESET%
echo %MAGENTA%============================================================%RESET%
echo.

echo   %GREEN%[1]%RESET% Run the game (desktop)
echo   %GREEN%[2]%RESET% Run the game (web)
echo.
echo   %YELLOW%[3]%RESET% Build the game (ReactTS -^> HTML/CSS/JS)
echo.
echo   %RED%[5]%RESET% Exit
echo.

set /p option=%WHITE%Enter your choice (1-4): %RESET%

if "%option%"=="1" goto run_desktop
if "%option%"=="2" goto run_web
if "%option%"=="3" goto build
if "%option%"=="4" goto exit_
if "%option%"=="" goto exit_

echo.
echo %RED%Invalid option. Please enter a number between 1 and 4.%RESET%
timeout /t 2 >nul
goto menu


:run_desktop
cls
echo.
echo %CYAN%[INFO]%RESET% Starting the game (desktop)...
echo.
py smm.py
goto check_exit


:run_web
cls
echo.
echo %CYAN%[INFO]%RESET% Starting the game (web)...
echo.
start "VITE" cmd /k "npm run dev"
echo %YELLOW%[WAIT]%RESET% Waiting for Vite server...
timeout /t 5 >nul
echo %GREEN%[OPEN]%RESET% Opening browser...
powershell -Command ^
"$wshell = New-Object -ComObject wscript.shell; ^
$wshell.AppActivate('VITE'); ^
Start-Sleep -Milliseconds 500; ^
$wshell.SendKeys('~o~')"
echo.
echo %GREEN%[DONE]%RESET% Web server started.
goto check_exit


:build
cls
echo.
echo %YELLOW%[BUILD]%RESET% Building the game...
echo.
npm.cmd run build
echo.
echo %GREEN%[DONE]%RESET% Build complete.
goto check_exit

:check_exit
if "!auto_exit!"=="1" goto exit_
echo.
pause
goto menu

:exit_
cls
exit /b