$ErrorActionPreference = 'Stop'
$rootPath = [System.IO.Path]::GetFullPath($PSScriptRoot)

if (-not (Get-Command node -ErrorAction SilentlyContinue) -and $env:OH_NODE_HOME) {
    $env:PATH = "$($env:OH_NODE_HOME);$env:PATH"
}
if (-not (Get-Command node -ErrorAction SilentlyContinue) -and (Test-Path -LiteralPath 'D:\node.exe')) {
    $env:PATH = "D:\;$env:PATH"
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw 'Node.js não foi encontrado. Instale Node.js 22.12+ e abra novamente o PowerShell.'
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw 'npm não foi encontrado. Reinstale Node.js incluindo npm e abra novamente o PowerShell.'
}
if (-not (Test-Path (Join-Path $rootPath 'node_modules\express\package.json'))) {
    throw 'As dependências ainda não estão instaladas. Execute npm install nesta pasta e tente novamente.'
}

Push-Location $rootPath
try {
    Write-Host 'Iniciando Olho de Hórus em http://127.0.0.1:4317'
    Write-Host 'Pressione Ctrl+C para encerrar.'
    npm start
    if ($LASTEXITCODE -ne 0) { throw "O servidor encerrou com o código $LASTEXITCODE." }
}
finally {
    Pop-Location
}
