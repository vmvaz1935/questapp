# Script de Setup do Frontend - FisioQ
# Execute este script para configurar o frontend

Write-Host "🎨 Configurando Frontend do FisioQ..." -ForegroundColor Cyan

# Verificar se Node.js está instalado
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado. Por favor, instale o Node.js primeiro." -ForegroundColor Red
    Write-Host "   Download: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Instalar dependências
Write-Host "`n📦 Instalando dependências..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao instalar dependências" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dependências instaladas" -ForegroundColor Green

# Verificar arquivo .env
if (-not (Test-Path ".env")) {
    Write-Host "`n📝 Criando arquivo .env..." -ForegroundColor Cyan
    $envContent = @"
# API Backend URL
VITE_API_URL=http://localhost:5000/api

# Google OAuth Client ID (para login com Google)
VITE_GOOGLE_CLIENT_ID=your-google-client-id

# Opcional - Sentry (Error Tracking)
VITE_ENABLE_SENTRY=false
VITE_SENTRY_DSN=your_sentry_dsn

# Opcional - Plausible (Analytics)
VITE_PLAUSIBLE_DOMAIN=your-domain.com

# Opcional - Gemini API (se usado)
GEMINI_API_KEY=your_gemini_api_key
"@
    Set-Content -Path ".env" -Value $envContent
    Write-Host "✅ Arquivo .env criado. Configure VITE_API_URL se necessário." -ForegroundColor Yellow
} else {
    Write-Host "`n✅ Arquivo .env já existe" -ForegroundColor Green
}

Write-Host "`n✨ Setup do frontend concluído!" -ForegroundColor Green
Write-Host "`nPara iniciar o servidor de desenvolvimento:" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor White

