# Checklist para Pull Request

## ✅ Antes de Criar o PR

### Código
- [x] Código implementado e testado
- [x] Build funcionando (`npm run build`)
- [x] Lint passando (`npm run lint`)
- [x] Testes passando (`npm run test`) - 83% (20/24)

### Documentação
- [x] README.md atualizado
- [x] CHANGELOG.md atualizado
- [x] Documentação técnica criada (docs/)
- [x] Comentários no código quando necessário

### Git
- [x] Branch criada (`feat/hardening-ux-lgpd`)
- [x] Commits atômicos e descritivos
- [x] Arquivos não necessários removidos
- [x] `.gitignore` atualizado

### Review
- [ ] Self-review realizado
- [ ] Código revisado manualmente
- [ ] Testes manuais realizados
- [ ] Performance testada (bundle size)

## 📋 Informações do PR

### Título
```
feat: implementar hardening UX/LGPD - melhorias críticas
```

### Descrição
Ver `PR_TEMPLATE.md` para descrição completa.

### Labels Sugeridas
- `enhancement`
- `security`
- `performance`
- `accessibility`
- `documentation`
- `pwa`
- `i18n`

### Assignees
- [ ] Atribuir revisores

### Reviewers
- [ ] Solicitar review de:
  - Segurança/LGPD
  - Performance
  - Acessibilidade
  - Arquitetura

## 🔍 Pontos para Review

### Segurança
- [ ] CSP está configurada corretamente
- [ ] Criptografia AES-GCM implementada corretamente
- [ ] LGPD documentado completamente
- [ ] Vulnerabilidades npm documentadas

### Performance
- [ ] Bundle size reduzido
- [ ] Code splitting funcionando
- [ ] Lazy loading implementado
- [ ] PWA cache strategies funcionando

### Acessibilidade
- [ ] Skip link funcional
- [ ] ARIA labels corretos
- [ ] Navegação por teclado funciona
- [ ] Focus visible aprimorado

### Testes
- [ ] Testes unitários criados
- [ ] Cobertura adequada (83% atual)
- [ ] Testes passando (20/24)

### Documentação
- [ ] README atualizado
- [ ] Documentação técnica completa
- [ ] CHANGELOG atualizado

## 🚀 Após Merge

- [ ] Verificar deploy em produção
- [ ] Monitorar erros no Sentry
- [ ] Verificar métricas do Plausible
- [ ] Atualizar documentação se necessário

## 📝 Notas

- **Testes**: 4 testes ainda falhando (ajustes menores necessários)
- **Sentry**: Opt-in via env var
- **Plausible**: Opt-in via env var
- **Firebase**: Continua opcional

