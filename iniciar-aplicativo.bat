@echo off
setlocal EnableExtensions
cd /d "%~dp0"

if defined OH_NODE_HOME set "PATH=%OH_NODE_HOME%;%PATH%"
if not defined OH_NODE_HOME if exist "D:\node.exe" set "PATH=D:\;%PATH%"
where node >nul 2>nul
if errorlevel 1 goto missingNode
where npm >nul 2>nul
if errorlevel 1 goto missingNpm
if not exist "node_modules\electron\package.json" goto missingDeps
if not exist "node_modules\better-sqlite3\package.json" goto missingDeps
if not exist "node_modules\express\package.json" goto missingDeps

echo Abrindo Olho de Horus em modo de desenvolvimento.
echo A janela permanece aberta para mostrar erros. Feche o aplicativo para encerrar.
npm run dev:desktop
if errorlevel 1 echo O aplicativo Electron encerrou com erro. Consulte as mensagens acima.
pause
exit /b 0

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
