@echo off
setlocal

set "PORT=8080"
set "URL=http://localhost:%PORT%"
set "ROOT=%~dp0"

cd /d "%ROOT%"

if not exist "index.html" (
  echo.
  echo [Hakimi Demo] index.html was not found in this folder.
  echo Please put this script inside the built web-desktop folder, then run it again.
  echo.
  pause
  exit /b 1
)

where py >nul 2>nul
if %errorlevel%==0 (
  set "PYTHON_CMD=py -3"
) else (
  where python >nul 2>nul
  if %errorlevel%==0 (
    set "PYTHON_CMD=python"
  ) else (
    echo.
    echo [Hakimi Demo] Python was not found.
    echo Please install Python 3, then run this script again.
    echo.
    pause
    exit /b 1
  )
)

echo.
echo [Hakimi Demo] Starting local server at %URL%
echo [Hakimi Demo] Close the server window when the demo is finished.
echo.

start "Hakimi Adventure Demo Server" cmd /k "%PYTHON_CMD% -m http.server %PORT%"

timeout /t 2 /nobreak >nul
start "" "%URL%"

endlocal
