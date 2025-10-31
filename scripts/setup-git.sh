#!/bin/bash

# Script para configurar Git e criar commits

echo "🔧 Configurando Git..."

# Verificar se Git está instalado
if ! command -v git &> /dev/null; then
    echo "❌ Git não está instalado. Por favor, instale o Git primeiro."
    exit 1
fi

# Configurar usuário (se não configurado globalmente)
if [ -z "$(git config --global user.name)" ]; then
    echo "📝 Configurando identidade do Git..."
    read -p "Digite seu nome: " git_name
    read -p "Digite seu email: " git_email
    git config --global user.name "$git_name"
    git config --global user.email "$git_email"
    echo "✅ Git configurado com sucesso!"
fi

# Verificar se é um repositório Git
if [ ! -d .git ]; then
    echo "📦 Inicializando repositório Git..."
    git init
    echo "✅ Repositório Git inicializado!"
fi

# Adicionar .gitignore se não existir
if [ ! -f .gitignore ]; then
    echo "📝 Criando .gitignore..."
    cat > .gitignore << 'EOF'
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Dependencies
node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store

# Environment variables
.env
.env.local
.env.*.local

# Build outputs
build
.vite
.cache

# Testing
coverage
.nyc_output

# PWA
sw.js
sw-register.ts
workbox-*.js
EOF
    echo "✅ .gitignore criado!"
fi

# Criar branch se não existir
current_branch=$(git branch --show-current 2>/dev/null)
if [ -z "$current_branch" ]; then
    echo "🌿 Criando branch feat/hardening-ux-lgpd..."
    git checkout -b feat/hardening-ux-lgpd
    echo "✅ Branch criada!"
fi

echo ""
echo "✅ Configuração concluída!"
echo ""
echo "📋 Próximos passos:"
echo "1. git add ."
echo "2. git commit -m 'feat: implementar hardening UX/LGPD'"
echo "3. git push -u origin feat/hardening-ux-lgpd"
echo ""

