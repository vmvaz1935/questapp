# Script PowerShell para configurar Git e criar commits

Write-Host "🔧 Configurando Git..." -ForegroundColor Cyan

# Verificar se Git está instalado
try {
    $gitVersion = git --version
    Write-Host "✅ Git instalado: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git não está instalado. Por favor, instale o Git primeiro." -ForegroundColor Red
    exit 1
}

# Verificar configuração do Git
$gitName = git config --global user.name
$gitEmail = git config --global user.email

if ([string]::IsNullOrEmpty($gitName) -or [string]::IsNullOrEmpty($gitEmail)) {
    Write-Host "📝 Configurando identidade do Git..." -ForegroundColor Yellow
    $name = Read-Host "Digite seu nome"
    $email = Read-Host "Digite seu email"
    git config --global user.name $name
    git config --global user.email $email
    Write-Host "✅ Git configurado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "✅ Git já configurado: $gitName <$gitEmail>" -ForegroundColor Green
}

# Verificar se é um repositório Git
if (-not (Test-Path .git)) {
    Write-Host "📦 Inicializando repositório Git..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Repositório Git inicializado!" -ForegroundColor Green
}

# Verificar branch atual
$currentBranch = git branch --show-current 2>$null

if ([string]::IsNullOrEmpty($currentBranch)) {
    Write-Host "🌿 Criando branch feat/hardening-ux-lgpd..." -ForegroundColor Yellow
    git checkout -b feat/hardening-ux-lgpd
    Write-Host "✅ Branch criada!" -ForegroundColor Green
} else {
    Write-Host "✅ Branch atual: $currentBranch" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Configuração concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. git add ."
Write-Host "2. git commit -m 'feat: implementar hardening UX/LGPD'"
Write-Host "3. git push -u origin feat/hardening-ux-lgpd"
Write-Host ""

