# Apresentação HTML - Plano de Negócios FisioQ

Apresentação web interativa e responsiva do plano de negócios do FisioQ.

## 📋 Características

- **16 slides** completos com conteúdo do plano de negócios
- **Navegação interativa** por setas, teclado, touch/swipe
- **Design moderno** com gradientes e animações suaves
- **Totalmente responsivo** para desktop, tablet e mobile
- **Gráficos interativos** para projeções financeiras
- **Progress bar** indicando posição na apresentação
- **Indicadores de slide** para navegação rápida

## 🚀 Como Usar

### Opção 1: Abrir Diretamente

1. Abra o arquivo `index.html` em um navegador moderno
2. Use as setas de navegação ou teclado para navegar

### Opção 2: Servidor Local

```bash
# Com Python 3
python -m http.server 8000

# Com Node.js (http-server)
npx http-server -p 8000

# Com PHP
php -S localhost:8000
```

Depois acesse: `http://localhost:8000/presentation/`

## ⌨️ Controles de Navegação

### Teclado
- **→ / ↓ / Espaço / PageDown**: Próximo slide
- **← / ↑ / PageUp**: Slide anterior
- **Home**: Primeiro slide
- **End**: Último slide
- **F11**: Modo fullscreen
- **ESC**: Sair do fullscreen

### Mouse
- **Setas de navegação**: Botões no rodapé
- **Indicadores**: Clique nos pontos à direita
- **Scroll**: Navega entre slides quando no topo/fundo

### Touch/Mobile
- **Swipe esquerda**: Próximo slide
- **Swipe direita**: Slide anterior
- **Toque nos indicadores**: Ir para slide específico

## 📊 Estrutura dos Slides

1. **Capa** - Apresentação inicial
2. **O Problema** - Dores dos fisioterapeutas
3. **A Solução** - Apresentação do FisioQ
4. **O Mercado** - Tamanho e oportunidades
5. **O Produto** - Funcionalidades principais
6. **Modelo de Negócio** - Planos e preços
7. **Diferenciais Competitivos** - Por que escolher FisioQ
8. **Tecnologia e Arquitetura** - Stack técnico
9. **Status Atual** - Progresso do desenvolvimento
10. **Roadmap** - Próximos passos
11. **Projeções Financeiras** - Receita e crescimento
12. **Necessidades de Investimento** - Breakdown de recursos
13. **Riscos e Mitigações** - Análise de riscos
14. **Equipe e Competências** - Habilidades e necessidades
15. **Métricas de Sucesso (KPIs)** - Indicadores principais
16. **Call to Action** - Próximos passos e contato

## 🎨 Personalização

### Cores

Edite as variáveis CSS em `styles.css`:

```css
:root {
    --primary-blue: #2563eb;
    --accent-green: #10b981;
    --accent-red: #ef4444;
    /* ... */
}
```

### Conteúdo

Edite diretamente o arquivo `index.html` para modificar o conteúdo dos slides.

### Gráficos

Os gráficos são gerados com Chart.js. Para modificar, edite a função `createRevenueChart()` em `script.js`.

## 📱 Responsividade

A apresentação é totalmente responsiva e se adapta a:
- **Desktop**: Layout completo com todos os elementos
- **Tablet**: Layout adaptado, grid responsivo
- **Mobile**: Layout vertical, navegação otimizada para touch

## 🌐 Navegadores Suportados

- Chrome/Edge (recomendado)
- Firefox
- Safari
- Opera

## 📦 Dependências (CDN)

- **Google Fonts**: Inter (tipografia)
- **Font Awesome 6.4.0**: Ícones
- **Chart.js 4.4.0**: Gráficos

Todas as dependências são carregadas via CDN, não é necessário instalar nada.

## 🔧 Estrutura de Arquivos

```
presentation/
├── index.html          # Arquivo principal
├── styles.css          # Estilos e animações
├── script.js           # Lógica de navegação
├── assets/             # Recursos visuais
│   ├── images/
│   │   ├── screenshots/
│   │   └── icons/
│   └── fonts/
└── README.md           # Este arquivo
```

## 🐛 Solução de Problemas

### Gráfico não aparece
- Certifique-se de que o Chart.js está carregando (verifique console do navegador)
- O gráfico só é criado quando o slide 11 é visualizado

### Animações não funcionam
- Verifique se o CSS está carregando corretamente
- Teste em um navegador moderno

### Navegação não responde
- Verifique se o JavaScript está habilitado
- Abra o console do navegador para verificar erros

## 📝 Notas

- A apresentação funciona melhor em modo fullscreen (F11)
- Para apresentações, recomenda-se usar Chrome ou Edge
- Teste a apresentação antes de usar em eventos importantes
- O conteúdo pode ser editado diretamente no HTML

## 📄 Licença

Este projeto faz parte do FisioQ e segue a mesma licença do projeto principal.

## 👥 Suporte

Para dúvidas ou problemas, consulte a documentação do projeto principal ou abra uma issue.

---

**Versão**: 1.0  
**Data**: Novembro 2025  
**Desenvolvido para**: FisioQ - Plano de Negócios

