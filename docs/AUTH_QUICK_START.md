# 🚀 Quick Start - Autenticação

Guia rápido para começar a usar o sistema de autenticação.

## ⚡ Setup Rápido (5 minutos)

### 1. Backend

```bash
cd server
npm install
cp .env.example .env
# Edite .env com suas configurações
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

### 2. Frontend

```bash
# Na raiz do projeto
npm install
# Adicione VITE_API_URL no .env
npm run dev
```

## 📝 Exemplo de Uso

### Login

```tsx
import { useAuthStore } from './stores/authStore';

function LoginComponent() {
  const { login, professional, isLoading } = useAuthStore();
  
  const handleLogin = async () => {
    try {
      await login('email@example.com', 'senha123');
      // Redirecionar ou atualizar UI
    } catch (error) {
      // Tratar erro
    }
  };
  
  return (
    <button onClick={handleLogin} disabled={isLoading}>
      Login
    </button>
  );
}
```

### Verificar Autenticação

```tsx
import { useAuthStore } from './stores/authStore';

function ProtectedComponent() {
  const { professional, accessToken } = useAuthStore();
  
  if (!professional || !accessToken) {
    return <div>Faça login primeiro</div>;
  }
  
  return <div>Bem-vindo, {professional.name}!</div>;
}
```

### Fazer Requisições Autenticadas

```tsx
import apiClient from './services/api';

async function fetchData() {
  try {
    const response = await apiClient.get('/api/protected-route');
    return response.data;
  } catch (error) {
    // Token será renovado automaticamente se necessário
    console.error(error);
  }
}
```

## 🔐 Fluxos Comuns

### Registro → Login → 2FA

1. Usuário se registra em `/register`
2. Recebe email de verificação
3. Clica no link para verificar email
4. Faz login em `/login`
5. Se 2FA ativado, é redirecionado para `/verify-2fa`
6. Digita código e acessa o sistema

### Reset de Senha

1. Usuário clica em "Esqueci minha senha" em `/login`
2. Preenche email em `/forgot-password`
3. Recebe email com link
4. Clica no link (vai para `/reset-password?token=...`)
5. Define nova senha
6. Faz login com nova senha

### Configurar 2FA

1. Usuário faz login
2. Acessa `/setup-2fa`
3. Escaneia QR code
4. Confirma com código
5. Guarda códigos de backup

## 📚 Componentes Disponíveis

- `<LoginForm />` - Formulário de login
- `<RegisterForm />` - Formulário de registro
- `<TwoFactorVerify />` - Verificação 2FA
- `<TwoFactorSetup />` - Configuração 2FA
- `<PasswordReset />` - Reset de senha
- `<GoogleLoginButton />` - Botão Google OAuth

## 🔗 Links

- [Documentação Completa](./AUTH_IMPLEMENTATION.md)
- [Guia de Instalação](../INSTALACAO_AUTH.md)

