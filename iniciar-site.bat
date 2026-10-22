@echo off
setlocal EnableExtensions
cd /d "%~dp0"
set "APP_URL=http://127.0.0.1:4317/"
set "API_URL=http://127.0.0.1:4317/api/auth/status"

if defined OH_NODE_HOME set "PATH=%OH_NODE_HOME%;%PATH%"
if not defined OH_NODE_HOME if exist "D:\node.exe" set "PATH=D:\;%PATH%"
where node >nul 2>nul
if errorlevel 1 goto missingNode
where npm >nul 2>nul
if errorlevel 1 goto missingNpm
if not exist "node_modules\express\package.json" goto missingDeps
if not exist "node_modules\better-sqlite3\package.json" goto missingDeps
if not exist "node_modules\express-session\package.json" goto missingDeps
if not exist "node_modules\helmet\package.json" goto missingDeps

powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r=Invoke-WebRequest -UseBasicParsing -Uri '%API_URL%' -TimeoutSec 2; if($r.StatusCode -eq 200 -and $r.Content -match 'needsSetup') { exit 0 } } catch {}; exit 1" >nul 2>nul
if not errorlevel 1 (
  echo O servidor Olho de Horus ja esta ativo. Abrindo o site...
  start "" "%APP_URL%"
  exit /b 0
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "$x=Get-NetTCPConnection -State Listen -LocalPort 4317 -ErrorAction SilentlyContinue; if($x) { exit 0 } else { exit 1 }" >nul 2>nul
if not errorlevel 1 goto portBusy

echo Iniciando o servidor web. A janela do servidor permanecera aberta para mostrar erros.
start "Servidor Olho de Horus" /D "%~dp0" cmd /k npm start
for /L %%I in (1,1,30) do (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r=Invoke-WebRequest -UseBasicParsing -Uri '%API_URL%' -TimeoutSec 2; if($r.StatusCode -eq 200 -and $r.Content -match 'needsSetup') { exit 0 } } catch {}; exit 1" >nul 2>nul
  if not errorlevel 1 (
    echo API pronta. Abrindo %APP_URL%
    start "" "%APP_URL%"
    exit /b 0
  )
  timeout /t 1 /nobreak >nul
)
echo O servidor nao respondeu em 30 segundos.
echo Consulte a janela "Servidor Olho de Horus" para ver a mensagem de erro.
pause
exit /b 1

:missingNode
echo Node.js nao foi encontrado no PATH. Instale Node.js LTS e abra este arquivo novamente.
echo Download oficial: https://nodejs.org/en/download
pause
exit /b 1

:missingNpm
echo npm nao foi encontrado. Reinstale Node.js incluindo npm e abra um novo terminal.
pause
exit /b 1

:missingDeps
echo As dependencias do projeto ainda nao estao instaladas.
echo Abra o PowerShell nesta pasta e execute: npm install
pause
exit /b 1

:portBusy
echo A porta 4317 esta ocupada por outro processo e nao parece ser o Olho de Horus.
echo Nenhum processo foi encerrado. Feche o aplicativo conhecido que usa essa porta ou solicite suporte.
pause
exit /b 1
