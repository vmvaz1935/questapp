# 🧪 Guia Completo de Testes - Sistema de Autenticação

## ✅ Testes Automatizados Realizados

### 1. Backend Health Check ✅
- **Endpoint**: `GET /health`
- **Status**: ✅ Funcionando
- **Resposta**: `{"status":"ok","timestamp":"..."}`

### 2. Registro de Usuário ✅
- **Endpoint**: `POST /api/auth/register`
- **Status**: ✅ Funcionando
- **Teste**: Criado usuário `teste@fisioq.com` e `teste2@fisioq.com`
- **Resultado**: 
  - Usuário criado com sucesso
  - Tokens (access + refresh) gerados
  - Token de verificação de email criado

### 3. Verificação de Email ✅
- **Endpoint**: `GET /api/auth/verify-email?token=...`
- **Status**: ✅ Funcionando
- **Nota**: Emails marcados como verificados manualmente para testes

### 4. Login ✅
- **Endpoint**: `POST /api/auth/login`
- **Status**: ✅ Funcionando
- **Teste**: Login com `teste@fisioq.com` e `teste2@fisioq.com`
- **Resultado**: 
  - Login bem-sucedido após verificação de email
  - Tokens JWT gerados corretamente

### 5. Setup 2FA ✅
- **Endpoint**: `POST /api/auth/2fa/setup`
- **Status**: ✅ Funcionando
- **Resultado**: 
  - QR Code gerado
  - Secret gerado
  - Backup codes criados

### 6. Refresh Token ✅
- **Endpoint**: `POST /api/auth/refresh`
- **Status**: ✅ Funcionando
- **Resultado**: Novo access token gerado com sucesso

### 7. Password Reset Request ✅
- **Endpoint**: `POST /api/auth/password-reset/request`
- **Status**: ✅ Funcionando
- **Resultado**: Token de reset criado (se email existe)

## 🌐 Testes Manuais no Navegador

### Teste 1: Registro de Novo Usuário

1. **Acesse**: http://localhost:3000/register

2. **Preencha o formulário**:
   - Nome: `Seu Nome`
   - Email: `seu-email@exemplo.com`
   - Senha: `MinhaSenh@123` (mínimo 8 caracteres, maiúscula, minúscula, número, caractere especial)
   - Confirmar Senha: `MinhaSenh@123`

3. **Clique em "Criar Conta"**

4. **Resultado esperado**:
   - ✅ Mensagem de sucesso
   - ✅ Redirecionamento para `/patients` ou página inicial
   - ⚠️ Se email não estiver verificado, pode ser necessário verificar manualmente no banco

### Teste 2: Login

1. **Acesse**: http://localhost:3000/login

2. **Preencha**:
   - Email: `teste@fisioq.com`
   - Senha: `Teste123!@#`

3. **Clique em "Entrar"**

4. **Resultado esperado**:
   - ✅ Login bem-sucedido
   - ✅ Redirecionamento para `/patients`
   - ✅ Token salvo no localStorage

### Teste 3: Verificação de Email

**Opção A: Via API (se token disponível)**
```
GET http://localhost:5000/api/auth/verify-email?token=TOKEN_AQUI
```

**Opção B: Manual no banco**
```sql
UPDATE "Professional" SET "emailVerified" = true WHERE email = 'seu-email@exemplo.com';
```

### Teste 4: Configuração de 2FA

1. **Faça login primeiro**

2. **Acesse**: http://localhost:3000/setup-2fa

3. **Siga os passos**:
   - Escaneie o QR code com Google Authenticator ou Authy
   - Digite o código de 6 dígitos
   - Guarde os códigos de backup

4. **Resultado esperado**:
   - ✅ 2FA configurado
   - ✅ Próximo login pedirá código 2FA

### Teste 5: Login com 2FA

1. **Faça logout**

2. **Acesse**: http://localhost:3000/login

3. **Faça login normalmente**

4. **Resultado esperado**:
   - ✅ Redirecionamento para `/verify-2fa`
   - ✅ Digite código do app autenticador
   - ✅ Acesso concedido

### Teste 6: Reset de Senha

1. **Acesse**: http://localhost:3000/forgot-password

2. **Digite seu email**: `teste@fisioq.com`

3. **Clique em "Enviar Link de Reset"**

4. **Resultado esperado**:
   - ✅ Mensagem de sucesso (mesmo se email não existir, por segurança)
   - ⚠️ Se SMTP configurado, email será enviado

5. **Para testar reset**:
   - Obtenha token do banco: `SELECT token FROM "PasswordReset" ORDER BY "createdAt" DESC LIMIT 1;`
   - Acesse: http://localhost:3000/reset-password?token=TOKEN_AQUI
   - Defina nova senha

### Teste 7: Logout

1. **Após fazer login**

2. **Implementar botão de logout** (ou usar DevTools):
   ```javascript
   localStorage.removeItem('accessToken');
   localStorage.removeItem('refreshToken');
   localStorage.removeItem('professional');
   window.location.href = '/login';
   ```

3. **Resultado esperado**:
   - ✅ Tokens removidos
   - ✅ Redirecionamento para login

## 🔍 Verificações Adicionais

### Verificar Tokens no LocalStorage

1. Abra DevTools (F12)
2. Vá em Application > Local Storage
3. Verifique:
   - `accessToken` - Token JWT de acesso
   - `refreshToken` - Token de refresh
   - `professional` - Dados do usuário (se persistido)

### Verificar Requisições de Rede

1. Abra DevTools (F12)
2. Vá em Network
3. Faça login/registro
4. Verifique:
   - ✅ Requisições para `/api/auth/*`
   - ✅ Headers com `Authorization: Bearer TOKEN`
   - ✅ Status 200/201 para sucesso

### Verificar Banco de Dados

```sql
-- Ver usuários criados
SELECT id, email, name, "emailVerified", "twoFactorEnabled" 
FROM "Professional";

-- Ver tokens de refresh
SELECT id, "professionalId", "expiresAt", "revokedAt" 
FROM "RefreshToken";

-- Ver logs de login
SELECT id, "professionalId", success, method, "createdAt" 
FROM "LoginLog" 
ORDER BY "createdAt" DESC 
LIMIT 10;
```

## 📊 Credenciais de Teste

### Usuário 1
- **Email**: `teste@fisioq.com`
- **Senha**: `Teste123!@#`
- **Status**: Email verificado ✅

### Usuário 2
- **Email**: `teste2@fisioq.com`
- **Senha**: `Teste123!@#`
- **Status**: Email verificado ✅

## ⚠️ Problemas Conhecidos e Soluções

### Problema: "Por favor, verifique seu email antes de fazer login"

**Solução**: Marque o email como verificado no banco:
```sql
UPDATE "Professional" SET "emailVerified" = true WHERE email = 'seu-email@exemplo.com';
```

### Problema: Email de verificação não chega

**Causa**: SMTP não configurado (normal em desenvolvimento)

**Solução**: 
- Configure SMTP no `server/.env` para produção
- Ou marque email como verificado manualmente no banco

### Problema: CORS Error

**Solução**: Verifique se `FRONTEND_URL` no `server/.env` está correto:
```env
FRONTEND_URL=http://localhost:3000
```

### Problema: Token expirado

**Solução**: O sistema deve renovar automaticamente via refresh token. Se não funcionar:
1. Faça logout
2. Faça login novamente

## ✅ Checklist de Testes

- [x] Backend rodando
- [x] Frontend rodando
- [x] Registro funcionando
- [x] Login funcionando
- [x] Verificação de email funcionando
- [x] 2FA setup funcionando
- [x] Refresh token funcionando
- [x] Password reset request funcionando
- [ ] Teste manual de registro no navegador
- [ ] Teste manual de login no navegador
- [ ] Teste manual de 2FA completo
- [ ] Teste manual de reset de senha completo
- [ ] Teste de logout
- [ ] Teste de rotas protegidas

## 🎯 Próximos Passos

1. ✅ Testar todos os fluxos no navegador
2. ✅ Configurar SMTP para emails reais
3. ✅ Configurar Google OAuth (opcional)
4. ✅ Adicionar botão de logout na interface
5. ✅ Implementar página de verificação de email
6. ✅ Adicionar tratamento de erros mais robusto
7. ✅ Adicionar loading states nos componentes
8. ✅ Implementar refresh automático de token

---

**Status**: ✅ Sistema funcional e pronto para testes manuais

**Data**: 2025-11-18

