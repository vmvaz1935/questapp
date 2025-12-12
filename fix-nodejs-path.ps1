# Script para adicionar Node.js ao PATH do sistema permanentemente
# Execute como Administrador

Write-Host "🔧 Configurando Node.js no PATH do sistema..." -ForegroundColor Cyan

# Verificar se está executando como Administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ Este script precisa ser executado como Administrador!" -ForegroundColor Red
    Write-Host "   Clique com botão direito no PowerShell e selecione 'Executar como administrador'" -ForegroundColor Yellow
    exit 1
}

# Caminho padrão do Node.js
$nodePath = "C:\Program Files\nodejs"

# Verificar se o Node.js está instalado
if (-not (Test-Path "$nodePath\node.exe")) {
    Write-Host "❌ Node.js não encontrado em: $nodePath" -ForegroundColor Red
    Write-Host "   Por favor, instale o Node.js primeiro: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Node.js encontrado em: $nodePath" -ForegroundColor Green

# Obter o PATH atual do sistema
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")

# Verificar se já está no PATH
if ($currentPath -like "*$nodePath*") {
    Write-Host "✅ Node.js já está no PATH do sistema" -ForegroundColor Green
} else {
    Write-Host "📝 Adicionando Node.js ao PATH do sistema..." -ForegroundColor Cyan
    
    # Adicionar ao PATH
    $newPath = $currentPath + ";$nodePath"
    [Environment]::SetEnvironmentVariable("Path", $newPath, "Machine")
    
    Write-Host "✅ Node.js adicionado ao PATH do sistema!" -ForegroundColor Green
}

# Atualizar PATH da sessão atual
$env:Path += ";$nodePath"

# Verificar instalação
Write-Host "`n🔍 Verificando instalação..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    $npxVersion = npx --version
    
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
    Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
    Write-Host "✅ npx: $npxVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Erro ao verificar versões. Reinicie o terminal e tente novamente." -ForegroundColor Yellow
}

Write-Host "`n✨ Configuração concluída!" -ForegroundColor Green
Write-Host "`n⚠️  IMPORTANTE:" -ForegroundColor Yellow
Write-Host "   1. Feche e reinicie o Cursor completamente" -ForegroundColor Yellow
Write-Host "   2. Feche e reabra qualquer terminal/PowerShell aberto" -ForegroundColor Yellow
Write-Host "   3. O Cursor precisa ser reiniciado para pegar as novas variáveis de ambiente" -ForegroundColor Yellow

