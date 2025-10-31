# PWA (Progressive Web App) - FisioQ

## Visão Geral

O FisioQ foi configurado como Progressive Web App (PWA), permitindo instalação no dispositivo do usuário e funcionamento offline básico.

## Recursos PWA

### 1. Manifest

- **Arquivo**: `public/manifest.json`
- **Configuração**: Nome, ícones, tema, orientação
- **Shortcuts**: Atalhos para "Pacientes" e "Questionários"

### 2. Service Worker

- **Arquivo**: `public/sw.js`
- **Estratégia de Cache**:
  - **Cache First**: Para assets estáticos (JS, CSS, imagens, fontes)
  - **Network First**: Para HTML e chamadas de API
  - **Fallback**: Para offline (retorna página cached ou offline message)

### 3. Registro

- **Arquivo**: `public/sw-register.ts`
- **Inicialização**: Automática no carregamento da aplicação
- **Atualizações**: Detecta e notifica novas versões

## Funcionamento Offline

### O que funciona offline:
- ✅ Visualização de páginas já visitadas
- ✅ Assets estáticos (JS, CSS, imagens)
- ✅ Dados já carregados no IndexedDB

### O que não funciona offline:
- ❌ Sincronização com Firebase
- ❌ Autenticação Google OAuth
- ❌ Carregamento de novos dados da API

## Instalação

### Desktop (Chrome/Edge)
1. Abrir o site
2. Clicar no ícone de instalação na barra de endereço
3. Ou: Menu → "Instalar FisioQ"

### Mobile (Android)
1. Abrir o site no Chrome
2. Menu → "Adicionar à tela inicial"
3. O app aparecerá como ícone na tela inicial

### iOS (Safari)
1. Abrir o site no Safari
2. Compartilhar → "Adicionar à Tela de Início"
3. O app aparecerá como ícone na tela inicial

## Cache Strategy

### Assets Estáticos (Cache First)
```
1. Verificar cache
2. Se encontrado → retornar do cache
3. Se não → buscar da rede e cachear
```

### HTML/API (Network First)
```
1. Buscar da rede
2. Se sucesso → cachear e retornar
3. Se falhar → retornar do cache
4. Se não houver cache → retornar offline message
```

## Limpeza de Cache

O Service Worker limpa automaticamente versões antigas do cache ao atualizar.

## Desenvolvimento

Para desabilitar PWA em desenvolvimento:
- Editar `vite.config.ts`: `devOptions: { enabled: false }`
- Ou usar: `npm run dev` (SW desabilitado por padrão em dev)

## Troubleshooting

### Service Worker não registra
- Verificar console do navegador
- Verificar HTTPS (SW requer HTTPS em produção)
- Verificar se `sw.js` está sendo servido

### Cache não atualiza
- Limpar cache do navegador
- Desregistrar SW: DevTools → Application → Service Workers → Unregister
- Recarregar a página

### Offline não funciona
- Verificar se SW está ativo
- Verificar se assets foram precacheados
- Verificar console para erros

## Próximos Passos

- [ ] Implementar Background Sync para sincronização offline
- [ ] Implementar Push Notifications
- [ ] Melhorar página offline customizada
- [ ] Implementar sincronização quando online novamente

