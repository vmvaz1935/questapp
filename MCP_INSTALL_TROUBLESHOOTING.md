# 🔧 Solução de Problemas - Instalação do MCP

Este guia ajuda a resolver problemas comuns na instalação do Model Context Protocol (MCP).

## 📋 Problemas Comuns

### 1. Erro: "npm não é reconhecido" ou "npx não é reconhecido"

**Sintoma:**
```
npm : O termo 'npm' não é reconhecido como nome de cmdlet...
npx : O termo 'npx' não é reconhecido como nome de cmdlet...
```

**Solução Rápida (Temporária - apenas para a sessão atual):**

Se o Node.js está instalado mas não está no PATH, adicione temporariamente:

```powershell
# Adicionar Node.js ao PATH da sessão atual
$env:Path += ";C:\Program Files\nodejs"

# Verificar se funcionou
node --version
npm --version
```

**Solução Permanente:**

1. **Verificar se Node.js está instalado:**
   ```powershell
   Test-Path "C:\Program Files\nodejs\node.exe"
   ```

2. **Se estiver instalado, adicionar ao PATH permanentemente:**
   - Pressione `Win + R`, digite `sysdm.cpl` e pressione Enter
   - Vá em "Avançado" → "Variáveis de Ambiente"
   - Em "Variáveis do sistema", encontre "Path" e clique em "Editar"
   - Clique em "Novo" e adicione: `C:\Program Files\nodejs\`
   - Clique em "OK" em todas as janelas
   - **Reinicie o terminal/PowerShell**

3. **Se não estiver instalado:**
   - Baixe e instale Node.js LTS: https://nodejs.org/
   - Durante a instalação, certifique-se de marcar a opção "Add to PATH"
   - Reinicie o terminal após a instalação

4. **Verificar instalação:**
   ```powershell
   node --version
   npm --version
   ```

### 2. Erro: "Permission denied" ou "EACCES"

**Sintoma:**
```
Error: EACCES: permission denied
```

**Solução (Windows):**

1. **Executar PowerShell como Administrador:**
   - Clique com botão direito no PowerShell
   - Selecione "Executar como administrador"

2. **Ou configurar npm para usar um diretório diferente:**
   ```powershell
   mkdir $env:APPDATA\npm-global
   npm config set prefix $env:APPDATA\npm-global
   ```

### 3. Erro: "Cannot find module" após instalação

**Sintoma:**
```
Error: Cannot find module '@modelcontextprotocol/sdk'
```

**Solução:**

1. **Limpar cache do npm:**
   ```powershell
   npm cache clean --force
   ```

2. **Remover node_modules e reinstalar:**
   ```powershell
   Remove-Item -Recurse -Force node_modules
   Remove-Item package-lock.json
   npm install
   ```

### 4. Erro: "Python not found" (se usar servidor MCP Python)

**Sintoma:**
```
Python was not found
```

**Solução:**

1. **Instalar Python:**
   - Baixe Python: https://www.python.org/downloads/
   - Durante a instalação, marque "Add Python to PATH"

2. **Verificar instalação:**
   ```powershell
   python --version
   ```

### 5. Erro: "Failed to install MCP server"

**Solução:**

1. **Verificar conexão com internet:**
   ```powershell
   Test-NetConnection registry.npmjs.org -Port 443
   ```

2. **Configurar proxy (se necessário):**
   ```powershell
   npm config set proxy http://proxy-server:port
   npm config set https-proxy http://proxy-server:port
   ```

3. **Usar registry alternativo:**
   ```powershell
   npm config set registry https://registry.npmjs.org/
   ```

### 6. Erro: "Version conflict" ou "Peer dependency"

**Sintoma:**
```
npm ERR! peer dep missing
```

**Solução:**

1. **Instalar com flag --legacy-peer-deps:**
   ```powershell
   npm install --legacy-peer-deps
   ```

2. **Ou usar --force:**
   ```powershell
   npm install --force
   ```

### 7. Erro: "ERR_USE_AFTER_CLOSE" ou "readline was closed" (Smithery CLI)

**Sintoma:**
```
Error [ERR_USE_AFTER_CLOSE]: readline was closed
```

**Causa:** O Smithery CLI está pedindo confirmação interativa, mas o terminal não pode responder.

**Solução:**

Use `echo` para passar a resposta automaticamente:

```powershell
# Para responder "Yes" automaticamente
echo Y | npx -y @smithery/cli@latest install @miottid/todoist-mcp --client cursor --profile SEU_PROFILE --key SUA_KEY

# Ou para responder "No"
echo N | npx -y @smithery/cli@latest install @miottid/todoist-mcp --client cursor --profile SEU_PROFILE --key SUA_KEY
```

**Exemplo completo:**
```powershell
# 1. Adicionar Node.js ao PATH (se necessário)
$env:Path += ";C:\Program Files\nodejs"

# 2. Executar comando com resposta automática
echo Y | npx -y @smithery/cli@latest install @miottid/todoist-mcp --client cursor --profile arrogant-earthworm-hBHAZp --key 1d567fb9-bfdb-4ec0-ad8f-0d11320f1cd1
```

## 🔍 Verificar Instalação do MCP

Após instalar, verifique se está funcionando:

```powershell
# Verificar se o pacote foi instalado
npm list @modelcontextprotocol/sdk

# Ou verificar versão do Node.js
node --version

# Verificar versão do npm
npm --version
```

## 📝 Instalação Manual do MCP SDK

Se a instalação automática falhar, tente instalar manualmente:

```powershell
# Instalar MCP SDK
npm install @modelcontextprotocol/sdk

# Ou versão específica
npm install @modelcontextprotocol/sdk@latest
```

## 🆘 Ainda com Problemas?

Se nenhuma das soluções acima funcionar:

1. **Coletar informações do erro:**
   ```powershell
   npm install --verbose > install-log.txt 2>&1
   ```

2. **Verificar logs:**
   - Abra o arquivo `install-log.txt`
   - Procure por mensagens de erro específicas

3. **Informações do sistema:**
   ```powershell
   node --version
   npm --version
   $PSVersionTable.PSVersion
   ```

## 🔗 Links Úteis

- [Documentação oficial do MCP](https://modelcontextprotocol.io/)
- [Documentação do npm](https://docs.npmjs.com/)
- [Node.js Downloads](https://nodejs.org/)

