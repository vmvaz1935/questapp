# Integração de Pagamento - PayPal e Mercado Pago

## 📋 Visão Geral

O FisioQ suporta múltiplos gateways de pagamento para assinatura do Plano Pro:
- **PayPal** - Pagamento direto via PayPal
- **Mercado Pago** - PIX e Cartão de Crédito

## 🔧 Configuração

### Variáveis de Ambiente

Adicione as seguintes variáveis no arquivo `.env`:

```env
# PayPal
VITE_PAYPAL_CLIENT_ID=sua_client_id_aqui

# Mercado Pago
VITE_MERCADOPAGO_PUBLIC_KEY=sua_public_key_aqui
VITE_MERCADOPAGO_ACCESS_TOKEN=sua_access_token_aqui
```

### PayPal

1. Crie uma conta em https://developer.paypal.com/
2. Crie um app e obtenha o Client ID
3. Configure as URLs de retorno:
   - Success: `https://seu-dominio.com/payment/success`
   - Cancel: `https://seu-dominio.com/payment/cancel`
4. Adicione `VITE_PAYPAL_CLIENT_ID` no `.env`

### Mercado Pago

1. Crie uma conta em https://www.mercadopago.com.br/developers/
2. Obtenha suas credenciais (Public Key e Access Token)
3. Configure webhooks:
   - URL: `https://seu-dominio.com/api/webhooks/mercadopago`
4. Adicione as credenciais no `.env`

## 🔄 Fluxo de Pagamento

### PayPal

1. Usuário seleciona PayPal
2. Sistema cria ordem via PayPal API
3. Usuário é redirecionado para aprovação
4. PayPal retorna para URL de sucesso
5. Webhook confirma pagamento
6. Plano é ativado automaticamente

### Mercado Pago - PIX

1. Usuário seleciona Mercado Pago > PIX
2. Sistema cria preferência de pagamento
3. QR Code PIX é gerado
4. Usuário paga via app bancário
5. Webhook confirma pagamento (instantâneo)
6. Plano é ativado automaticamente

### Mercado Pago - Cartão

1. Usuário seleciona Mercado Pago > Cartão
2. Usuário preenche dados do cartão
3. Sistema tokeniza cartão (não armazena dados sensíveis)
4. Pagamento é processado
5. Webhook confirma pagamento
6. Plano é ativado automaticamente

## 🛡️ Segurança

### Boas Práticas

1. **Nunca armazene dados de cartão** - Use tokenização
2. **Valide webhooks** - Verifique assinatura dos webhooks
3. **Use HTTPS** - Obrigatório para gateways de pagamento
4. **Logs de auditoria** - Registre todas as transações
5. **Rate limiting** - Limite tentativas de pagamento

### PCI DSS

Para processar cartões de crédito:
- Use tokenização (Mercado Pago oferece)
- Não armazene CVV ou dados completos
- Use HTTPS sempre
- Considere usar Stripe.js ou Mercado Pago SDK para inputs de cartão

## 📝 Implementação Real (TODO)

### PayPal

```typescript
// services/paypalService.ts
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

export async function createPayPalOrder(amount: number) {
  const response = await fetch('/api/paypal/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount })
  });
  return response.json();
}

export async function capturePayPalOrder(orderId: string) {
  const response = await fetch(`/api/paypal/capture/${orderId}`, {
    method: 'POST'
  });
  return response.json();
}
```

### Mercado Pago

```typescript
// services/mercadopagoService.ts
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';

export async function createMercadoPagoPreference(data: any) {
  const response = await fetch('/api/mercadopago/preference', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
}
```

## 🔔 Webhooks

### PayPal Webhook

```typescript
// api/webhooks/paypal.ts
export async function handlePayPalWebhook(req: Request) {
  // Verificar assinatura
  // Processar evento
  // Ativar plano se pagamento aprovado
}
```

### Mercado Pago Webhook

```typescript
// api/webhooks/mercadopago.ts
export async function handleMercadoPagoWebhook(req: Request) {
  // Verificar assinatura
  // Processar notificação
  // Ativar plano se pagamento aprovado
}
```

## 📊 Status de Pagamento

- `pending` - Aguardando confirmação
- `approved` - Pagamento aprovado
- `rejected` - Pagamento rejeitado
- `cancelled` - Pagamento cancelado
- `refunded` - Pagamento reembolsado

## 🧪 Testes

### PayPal Sandbox

Use credenciais de sandbox para testes:
- Email: `buyer@example.com`
- Senha: (fornecida no dashboard)

### Mercado Pago Test

Use cartões de teste:
- Aprovado: `5031 4332 1540 6351`
- Rejeitado: `5031 4332 1540 6352`

## 📚 Recursos

- [PayPal Developer Docs](https://developer.paypal.com/docs/)
- [Mercado Pago Developers](https://www.mercadopago.com.br/developers/)
- [PCI DSS Compliance](https://www.pcisecuritystandards.org/)

## ⚠️ Avisos

1. **Modo de desenvolvimento** - Atualmente simula pagamentos
2. **Credenciais reais necessárias** - Para produção, configure as APIs
3. **Webhooks obrigatórios** - Para confirmação automática de pagamento
4. **Teste extensivamente** - Antes de ir para produção

