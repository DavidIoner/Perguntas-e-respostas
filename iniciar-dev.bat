@echo off
setlocal

set "WEB_DIR=%~dp0"
set "URL=http://localhost:5173"

if not exist "%WEB_DIR%package.json" (
  echo Nao encontrei package.json.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo Nao encontrei o npm. Instale o Node.js antes de continuar.
  pause
  exit /b 1
)

cd /d "%WEB_DIR%"

if not exist "node_modules" (
  echo Instalando dependencias...
  if exist "package-lock.json" (
    call npm ci
  ) else (
    call npm install
  )

  if errorlevel 1 (
    echo Falha ao instalar dependencias.
    pause
    exit /b 1
  )
)

echo Abrindo %URL% ...
start "" "%URL%"

echo Iniciando servidor de desenvolvimento...
call npm run dev -- --host 127.0.0.1

endlocal
