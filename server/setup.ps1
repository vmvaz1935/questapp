# Script de Setup do Backend - FisioQ
# Execute este script para configurar o ambiente

Write-Host "🚀 Configurando Backend do FisioQ..." -ForegroundColor Cyan

# Verificar se Node.js está instalado
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado. Por favor, instale o Node.js primeiro." -ForegroundColor Red
    Write-Host "   Download: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Verificar se npm está instalado
try {
    $npmVersion = npm --version
    Write-Host "✅ npm encontrado: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm não encontrado." -ForegroundColor Red
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

# Criar arquivo .env se não existir
if (-not (Test-Path ".env")) {
    Write-Host "`n📝 Criando arquivo .env..." -ForegroundColor Cyan
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Arquivo .env criado. Por favor, edite com suas configurações." -ForegroundColor Yellow
    Write-Host "   IMPORTANTE: Configure pelo menos DATABASE_URL e JWT_SECRET" -ForegroundColor Yellow
} else {
    Write-Host "`n✅ Arquivo .env já existe" -ForegroundColor Green
}

# Gerar Prisma Client
Write-Host "`n🔧 Gerando Prisma Client..." -ForegroundColor Cyan
npm run prisma:generate

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Aviso: Erro ao gerar Prisma Client. Verifique se o DATABASE_URL está configurado." -ForegroundColor Yellow
} else {
    Write-Host "✅ Prisma Client gerado" -ForegroundColor Green
}

Write-Host "`n✨ Setup concluído!" -ForegroundColor Green
Write-Host "`nPróximos passos:" -ForegroundColor Cyan
Write-Host "1. Edite o arquivo .env com suas configurações" -ForegroundColor White
Write-Host "2. Configure o banco de dados PostgreSQL" -ForegroundColor White
Write-Host "3. Execute: npm run prisma:migrate" -ForegroundColor White
Write-Host "4. Execute: npm run dev" -ForegroundColor White

