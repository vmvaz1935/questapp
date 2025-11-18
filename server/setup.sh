#!/bin/bash
# Script de Setup do Backend - FisioQ
# Execute este script para configurar o ambiente

echo "🚀 Configurando Backend do FisioQ..."

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale o Node.js primeiro."
    echo "   Download: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"

# Verificar se npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado."
    exit 1
fi

echo "✅ npm encontrado: $(npm --version)"

# Instalar dependências
echo ""
echo "📦 Instalando dependências..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências"
    exit 1
fi

echo "✅ Dependências instaladas"

# Criar arquivo .env se não existir
if [ ! -f ".env" ]; then
    echo ""
    echo "📝 Criando arquivo .env..."
    cp .env.example .env
    echo "✅ Arquivo .env criado. Por favor, edite com suas configurações."
    echo "   IMPORTANTE: Configure pelo menos DATABASE_URL e JWT_SECRET"
else
    echo ""
    echo "✅ Arquivo .env já existe"
fi

# Gerar Prisma Client
echo ""
echo "🔧 Gerando Prisma Client..."
npm run prisma:generate

if [ $? -ne 0 ]; then
    echo "⚠️  Aviso: Erro ao gerar Prisma Client. Verifique se o DATABASE_URL está configurado."
else
    echo "✅ Prisma Client gerado"
fi

echo ""
echo "✨ Setup concluído!"
echo ""
echo "Próximos passos:"
echo "1. Edite o arquivo .env com suas configurações"
echo "2. Configure o banco de dados PostgreSQL"
echo "3. Execute: npm run prisma:migrate"
echo "4. Execute: npm run dev"

