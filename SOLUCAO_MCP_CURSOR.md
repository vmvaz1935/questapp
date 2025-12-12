# 🔧 Solução: Erro "npx não reconhecido" no Cursor MCP

## 📋 Problema

O Cursor está mostrando erros ao tentar executar o servidor MCP:
```
[error] 'npx' não reconhecido como um comando interno ou externo
[error] Client error for command spawn npx ENOENT
```

## 🔍 Causa

O Node.js está instalado, mas não está no **PATH do sistema**. O Cursor precisa que o `npx` esteja acessível globalmente para executar os servidores MCP.

## ✅ Solução

### Opção 1: Script Automático (Recomendado)

1. **Abra o PowerShell como Administrador:**
   - Pressione `Win + X`
   - Selecione "Windows PowerShell (Admin)" ou "Terminal (Admin)"

2. **Execute o script:**
   ```powershell
   cd C:\Users\mvito\Projetos\questapp
   .\fix-nodejs-path.ps1
   ```

3. **Reinicie o Cursor completamente:**
   - Feche todas as janelas do Cursor
   - Abra o Cursor novamente

### Opção 2: Manual

1. **Adicionar Node.js ao PATH do sistema:**
   - Pressione `Win + R`
   - Digite `sysdm.cpl` e pressione Enter
   - Vá em "Avançado" → "Variáveis de Ambiente"
   - Em "Variáveis do sistema", encontre "Path" e clique em "Editar"
   - Clique em "Novo"
   - Adicione: `C:\Program Files\nodejs\`
   - Clique em "OK" em todas as janelas

2. **Verificar se funcionou:**
   - Abra um **novo** PowerShell (não use o antigo)
   - Execute:
     ```powershell
     node --version
     npm --version
     npx --version
     ```

3. **Reiniciar o Cursor:**
   - Feche completamente o Cursor
   - Abra novamente

### Opção 3: Verificar Caminho do Node.js

Se o Node.js estiver instalado em outro local:

1. **Encontrar onde está instalado:**
   ```powershell
   Get-Command node -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
   ```

2. **Adicionar esse caminho ao PATH** (seguindo a Opção 2)

## 🔄 Após a Correção

1. **Reinicie o Cursor completamente**
2. **Verifique os logs do MCP:**
   - Os erros de `npx não reconhecido` devem desaparecer
   - O servidor MCP do Todoist deve iniciar corretamente

## 🧪 Teste Rápido

Após reiniciar o Cursor, você pode testar se está funcionando:

1. Abra o terminal integrado do Cursor (`Ctrl + '`)
2. Execute:
   ```powershell
   npx --version
   ```
3. Se mostrar a versão, está funcionando! ✅

## ⚠️ Importante

- **Sempre reinicie o Cursor** após alterar variáveis de ambiente
- O Cursor precisa ser fechado completamente (não apenas a janela)
- Se ainda não funcionar, verifique se o Node.js está realmente instalado em `C:\Program Files\nodejs\`

## 🆘 Ainda com Problemas?

Se após seguir os passos acima ainda houver erros:

1. **Verifique a instalação do Node.js:**
   ```powershell
   Test-Path "C:\Program Files\nodejs\node.exe"
   ```

2. **Verifique o PATH atual:**
   ```powershell
   [Environment]::GetEnvironmentVariable("Path", "Machine")
   ```

3. **Reinstale o Node.js:**
   - Baixe de: https://nodejs.org/
   - Durante a instalação, certifique-se de marcar "Add to PATH"
   - Reinicie o computador após a instalação

