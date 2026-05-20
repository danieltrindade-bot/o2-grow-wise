# Avaliacao Brownfield — O2 Diagnostico Financeiro

**Data:** 2026-05-15
**Analista:** Atlas (Business Analyst Agent)
**Origem do projeto:** Lovable (no-code) com Supabase + TanStack Start SSR
**Estado atual:** Convertido para Vite + React SPA com localStorage

---

## 1. Tech Stack

**Classificacao: Bom**

| Camada | Tecnologia | Versao |
|---|---|---|
| Framework | React | 19.2.0 |
| Build | Vite | 7.3.1 |
| Roteamento | TanStack Router | 1.168.25 |
| State (server) | TanStack React Query | 5.83.0 |
| State (client) | React Context + sessionStorage | -- |
| CSS | Tailwind CSS v4 + tw-animate-css | 4.2.1 |
| Componentes UI | shadcn/ui (estilo new-york) + Radix UI | -- |
| Formularios | React Hook Form + Zod | 7.71 / 3.24 |
| PDF | jsPDF + jspdf-autotable | 4.2.1 / 5.0.7 |
| Graficos | Recharts | 2.15.4 |
| Icones | Lucide React | 0.575.0 |
| Persistencia | localStorage (local-store.ts) | -- |
| Autenticacao | localStorage (local-auth.ts) | -- |
| TypeScript | Strict mode | 5.8.3 |
| Linting | ESLint 9 + Prettier | 9.32 / 3.7 |

**Observacoes:**
- Stack moderna e bem escolhida para um SPA.
- TanStack Router com file-based routing e code-splitting automatico (`autoCodeSplitting: true` em `vite.config.ts`).
- Tailwind v4 com `@tailwindcss/vite` plugin (abordagem mais recente).
- Path aliases configurados via `tsconfig.json` (`@/*` -> `./src/*`).

---

## 2. Estrutura do Projeto

**Classificacao: Bom**

```
src/
  main.tsx                    # Entry point
  router.tsx                  # TanStack Router config
  routeTree.gen.ts            # Auto-generated route tree
  styles.css                  # Tailwind + design tokens
  context/
    AuthContext.tsx            # Auth state (localStorage)
    DiagnosticContext.tsx      # Quiz state (sessionStorage)
  routes/
    __root.tsx                 # Root layout (providers)
    index.tsx                  # Landing page
    diagnostico.tsx            # Quiz (3 telas)
    resultados.tsx             # Results dashboard
    servicos.tsx               # Service catalog
    admin.login.tsx            # Admin login
    admin.index.tsx            # Admin panel (7 tabs)
    calculadora.oxy.tsx        # Calc: Oxy + Genio
    calculadora.bpo.tsx        # Calc: BPO Financeiro
    calculadora.cfo.tsx        # Calc: CFO as a Service
    calculadora.assessoria.tsx # Calc: Assessoria
    calculadora.coordenador.tsx# Calc: Coordenador
  lib/
    local-auth.ts              # Auth com SHA-256 + localStorage
    local-store.ts             # CRUD sobre localStorage
    seed-data.ts               # Dados iniciais (16 tabelas)
    diagnostic-questions.ts    # Perguntas fallback
    results-logic.ts           # Logica de resultados
    pricing-shared.ts          # Logica de precificacao
    pdf-export.ts              # Geracao de PDF
    admin-audit.ts             # Log de auditoria
    utils.ts                   # cn() helper
    error-page.ts              # Pagina de erro SSR (morta)
    error-capture.ts           # Captura de erros SSR (morta)
  hooks/
    use-pricing.ts             # React Query hooks para dados
    use-mobile.tsx             # Hook de breakpoint mobile
  components/
    SiteHeader.tsx             # Header + ScrollToTop + Breadcrumbs(!)
    Breadcrumbs.tsx            # Breadcrumbs (duplicado!)
    ProtectedRoute.tsx         # Guard de rota admin
    Placeholder.tsx            # Componente placeholder
    calc-ui.tsx                # Loading/Error/useCountUp
    InfoTooltip.tsx            # Tooltip com textos
    admin/                     # 7 tabs do painel admin
    ui/                        # 47 componentes shadcn/ui
  integrations/
    supabase/
      client.ts                # Fake Supabase client (localStorage)
      types.ts                 # Types do Supabase (672 linhas)
```

**Observacoes:**
- Organizacao clara e consistente para um projeto deste porte.
- 11 rotas, todas com code-splitting.
- Componentes admin bem separados em `components/admin/`.
- Total de linhas: ~92.000 (inclui os 47 componentes shadcn/ui gerados).

---

## 3. Inventario de Features

**Classificacao: Bom**

| Feature | Rota | Descricao |
|---|---|---|
| Landing Page | `/` | Hero, Metodologia DIAP, Servicos, CTA |
| Diagnostico (Quiz) | `/diagnostico` | 3 telas: dados empresa, entendimento negocio, 10 perguntas semaforo |
| Resultados | `/resultados` | Score gauge, maturidade, estimativa de perdas, outcomes 90 dias, recomendacao |
| Catalogo de Servicos | `/servicos` | 5 cards com destaque para recomendado |
| Calculadora BPO | `/calculadora/bpo` | Tiers, pacotes, setup, descontos, exportar PDF |
| Calculadora CFO | `/calculadora/cfo` | Faturamento, CNPJ, complexidade (6 sliders), setup, exportar PDF |
| Calculadora Oxy | `/calculadora/oxy` | CNPJ, segmento, 12x cartao, exportar PDF |
| Calculadora Assessoria | `/calculadora/assessoria` | Faturamento, CNPJs, exportar PDF |
| Calculadora Coordenador | `/calculadora/coordenador` | Faturamento, CNPJ, segmento, exportar PDF |
| Login Admin | `/admin/login` | Email + senha, signup restrito a @o2inc.com.br |
| Painel Admin | `/admin` | 7 tabs: Perguntas, Custos, Maturidade, Recomendacoes, BPO, CFO, Demais |
| Exportar PDF (Diagnostico) | -- | jsPDF com header branded, tabelas, gauge |
| Exportar PDF (Calculadoras) | -- | jsPDF com proposta comercial |

**Fluxo principal:** Landing -> Diagnostico (3 etapas) -> Resultados -> Servicos -> Calculadora -> PDF

---

## 4. Dependencias

**Classificacao: Precisa Melhorar**

### Dependencias nao utilizadas ou subutilizadas

| Dependencia | Tamanho (est.) | Status | Motivo |
|---|---|---|---|
| `recharts` | ~300KB | **NAO USADO** | Apenas importado em `components/ui/chart.tsx` (shadcn), nenhuma rota usa graficos |
| `react-day-picker` + `date-fns` | ~100KB | **NAO USADO** | `calendar.tsx` (shadcn) existe mas nenhuma rota usa |
| `input-otp` | ~15KB | **NAO USADO** | `input-otp.tsx` (shadcn) existe mas nenhuma rota usa |
| `embla-carousel-react` | ~30KB | **NAO USADO** | `carousel.tsx` (shadcn) existe mas nenhuma rota usa |
| `react-resizable-panels` | ~20KB | **NAO USADO** | `resizable.tsx` (shadcn) existe mas nenhuma rota usa |
| `cmdk` | ~15KB | **NAO USADO** | `command.tsx` (shadcn) existe mas nenhuma rota usa |
| `vaul` | ~20KB | **NAO USADO** | `drawer.tsx` (shadcn) existe mas nenhuma rota usa |
| `@hookform/resolvers` | ~5KB | **NAO USADO** | Nenhum formulario usa Zod resolver |
| `react-hook-form` | ~30KB | **NAO USADO** | `form.tsx` (shadcn) existe mas formularios usam state direto |
| `zod` | ~15KB | **NAO USADO** | Nenhum schema Zod definido |
| `@tanstack/react-query` | ~40KB | **SUBUTILIZADO** | Usado apenas como wrapper sincrono para localStorage |

### Componentes shadcn/ui nao utilizados (34 de 47)

Apenas **13** dos 47 componentes shadcn/ui sao importados no codigo:
`button`, `checkbox`, `currency-input`, `input`, `label`, `progress`, `radio-group`, `select`, `skeleton`, `slider`, `tabs`, `textarea`, `tooltip`.

Os outros 34 componentes nunca sao importados:
`accordion`, `alert-dialog`, `alert`, `aspect-ratio`, `avatar`, `badge`, `breadcrumb`, `calendar`, `card`, `carousel`, `chart`, `collapsible`, `command`, `context-menu`, `dialog`, `drawer`, `dropdown-menu`, `form`, `hover-card`, `input-otp`, `menubar`, `navigation-menu`, `pagination`, `popover`, `resizable`, `scroll-area`, `separator`, `sheet`, `sidebar`, `sonner`, `switch`, `table`, `toggle-group`, `toggle`.

**Nota:** O componente `sonner` (toast) e importado indiretamente pelos admin tabs via `import { toast } from "sonner"`, entao ele **e usado**. Mas o wrapper `components/ui/sonner.tsx` nao e.

### Dependencias pesadas no bundle

| Chunk | Tamanho | Conteudo |
|---|---|---|
| `Breadcrumbs-*.js` | **412 KB** | jsPDF + flibs de compressao (CRITICO) |
| `index-NIpKAipd.js` | 346 KB | React + TanStack Router (core) |
| `html2canvas.esm-*.js` | 201 KB | html2canvas (dependencia indireta de jsPDF) |
| `index.es-*.js` | 159 KB | jsPDF core |
| `index-BYRgtm1q.css` | 84 KB | Tailwind CSS (ok, comprime bem) |

**Total do bundle:** ~1.5 MB (sem gzip). O jsPDF sozinho e responsavel por ~772 KB (~51% do bundle JS).

---

## 5. Qualidade de Codigo

**Classificacao: Precisa Melhorar**

### Padroes positivos
- Componentes funcionais consistentes.
- TypeScript com strict mode.
- Separacao clara entre logica (`lib/`) e UI (`routes/`, `components/`).
- Code-splitting automatico por rota.
- Design tokens via CSS custom properties.
- Tema escuro consistente (always-dark).

### Violacoes DRY

| Codigo duplicado | Localizacoes | Linhas |
|---|---|---|
| `formatBRL()` | 6 definicoes: `pricing-shared.ts:57`, `results-logic.ts:228`, `pdf-export.ts:4`, `currency-input.tsx:10`, `calculadora.bpo.tsx:45`, `calculadora.cfo.tsx:24` | ~30 |
| `formatDateBR()` | 2 definicoes: `diagnostico.tsx:26`, `resultados.tsx:39` | ~8 |
| `Row()` component | 5 definicoes identicas: `calculadora.oxy.tsx:173`, `calculadora.bpo.tsx:261`, `calculadora.cfo.tsx:285`, `calculadora.assessoria.tsx:158`, `calculadora.coordenador.tsx:165` | ~35 |
| `Breadcrumbs` component | 2 definicoes: `components/Breadcrumbs.tsx`, `components/SiteHeader.tsx:95` | ~30 |
| CRUD admin pattern | 6 tabs admin com padrao insert/update/delete quase identico | ~600+ |

### Code smells

1. **`as any` excessivo:** 10 ocorrencias fora do `routeTree.gen.ts`. Maior infrator: `hooks/use-pricing.ts` (linhas 7-8) e `admin/CfoTab.tsx` (linha 25).

2. **eslint-disable comments:** `react-hooks/exhaustive-deps` desabilitado em 5 locais nas calculadoras para evitar loops no `useEffect` de sincronizacao de estado.

3. **`useMemo` com mutable Maps:** Os admin tabs usam `useMemo(() => new Map(), [])` para `original` data, o que cria maps mutaveis que persistem entre renders. Funciona, mas e um anti-pattern — `useRef` seria mais semantico.

4. **Hook `useCountUp` chamado condicionalmente:** Em `resultados.tsx:222`, `useCountUp(grade, 700)` e chamado dentro do JSX de `ScoreSummary`, o que funciona aqui mas viola a regra de hooks se a arvore mudar.

5. **`noUnusedLocals: false` e `noUnusedParameters: false`** em `tsconfig.json` — reduz a eficacia do TypeScript.

---

## 6. Divida Tecnica

**Classificacao: Critico**

### Heranca do Lovable

| Item | Arquivo(s) | Impacto | Prioridade |
|---|---|---|---|
| `.lovable/project.json` | `.lovable/project.json` | Metadata morta | Baixa |
| Tipos Supabase (672 linhas) | `integrations/supabase/types.ts` | Codigo morto, confuso | Media |
| Fake Supabase client | `integrations/supabase/client.ts` | **Gambiarra critica** — emula a API Supabase sobre localStorage | Alta |
| Migracoes SQL mortas | `supabase/migrations/*.sql` | Codigo morto | Baixa |
| `supabase/config.toml` | `supabase/config.toml` | Configuracao morta | Baixa |
| `.env` com chaves Supabase | `.env` | Credenciais mortas expostas, confunde devs | Media |

### Heranca do TanStack Start (SSR)

| Item | Arquivo(s) | Impacto | Prioridade |
|---|---|---|---|
| `error-page.ts` | `src/lib/error-page.ts` | Gera HTML SSR — codigo completamente morto em SPA | Baixa |
| `error-capture.ts` | `src/lib/error-capture.ts` | Captura erros server-side — morto em SPA | Baixa |
| `typeof window` checks | `DiagnosticContext.tsx` (3x), `SiteHeader.tsx` (1x) | Desnecessario em SPA (window sempre existe) | Baixa |
| Regra ESLint `server-only` | `eslint.config.js:27-33` | Regra para Next.js/TanStack Start, irrelevante | Baixa |
| `.output`, `.vinxi` no gitignore/eslint | `eslint.config.js:9`, `.gitignore` | Configuracao para TanStack Start | Baixa |

### Camada de Compatibilidade Supabase (a mais critica)

O arquivo `src/integrations/supabase/client.ts` e uma **emulacao completa da API do Supabase** (QueryBuilder com `select`, `insert`, `update`, `delete`, `order`, `eq`, `limit`, `maybeSingle`) que opera sobre localStorage. Isso foi feito para que os admin tabs (que usam `supabase.from("table").select("*")`) nao precisassem ser reescritos.

**Problema:** Os admin tabs (`QuestionsTab.tsx`, `CostsTab.tsx`, `MaturityTab.tsx`, `RecommendationsTab.tsx`) ainda importam `supabase` de `@/integrations/supabase/client` e usam a API fake como se fosse o Supabase real. Enquanto isso, os hooks de pricing (`use-pricing.ts`) fazem exatamente a mesma coisa. O `local-store.ts` ja oferece funcoes diretas (`selectAll`, `insertRows`, `updateRow`, `deleteRow`) que poderiam ser usadas diretamente.

**Impacto:** Duas camadas de abstracao desnecessarias (Supabase fake -> local-store -> localStorage).

### React Query desnecessario

`@tanstack/react-query` esta sendo usado em `use-pricing.ts` para wrappear chamadas sincronas ao localStorage. `useQuery` com `staleTime: 5min` nao faz sentido para dados locais que nunca mudam remotamente. O overhead inclui:
- QueryClient instanciado em `router.tsx`
- `QueryClientProvider` no `__root.tsx`
- Cache invalidation nunca utilizada
- Estado de loading/error que nunca deveria ocorrer com localStorage

---

## 7. Performance

**Classificacao: Precisa Melhorar**

### Bundle Size

| Metrica | Valor | Alvo |
|---|---|---|
| Total JS (sem gzip) | ~1.42 MB | < 500 KB |
| Total JS (gzip est.) | ~450 KB | < 150 KB |
| Total CSS | 84 KB | OK |
| Maior chunk | 412 KB (Breadcrumbs-*.js) | < 100 KB |

### Problemas identificados

1. **jsPDF no chunk compartilhado (412 KB):** O `Breadcrumbs` component importa `pdf-export.ts` indiretamente via `resultados.tsx`, e o Vite coloca jsPDF + html2canvas no chunk compartilhado. jsPDF deveria ser lazy-loaded via `import()` dinamico apenas quando o usuario clica "Exportar PDF". Isso reduziria o carregamento inicial em ~772 KB.

2. **recharts (300+ KB) no bundle:** Importado apenas por `components/ui/chart.tsx` que nunca e usado. Deve ser removido do `package.json`.

3. **34 componentes shadcn/ui nao utilizados:** Embora o tree-shaking deva elimina-los, eles poluem o projeto e podem confundir.

4. **`useCountUp` em cada calculadora:** Animacao via `requestAnimationFrame` roda a cada mudanca de valor. Funcional, mas causa re-renders desnecessarios. Nao e critico, mas e um desperdicio em mobile.

5. **Google Fonts carregado via CSS `@import`:** `styles.css:1` importa Inter do Google Fonts via URL externa. Sem `font-display: swap` explicito (depende do `&display=swap` na URL, que esta presente).

### Code-splitting

O code-splitting esta funcionando bem gracas ao `autoCodeSplitting: true` do TanStack Router. Cada rota e um chunk separado. O problema e que chunks compartilhados (como o de Breadcrumbs) estao puxando dependencias pesadas.

---

## 8. UX Issues

**Classificacao: Precisa Melhorar**

### Funcionalidades ausentes

| Feature | Impacto | Prioridade |
|---|---|---|
| Persistencia do diagnostico entre sessoes | `sessionStorage` perde dados ao fechar aba | Alta |
| Validacao de formulario no diagnostico | Nenhuma validacao alem de "campo vazio" | Media |
| Feedback ao salvar no admin | Usa `toast` (sonner), mas nao ha estado de "sucesso" visual persistente | Baixa |
| Responsividade do admin panel | Tabelas admin nao sao responsivas em mobile | Media |
| Recuperacao de senha | Nao existe "esqueci senha" | Alta (se auth for permanente) |
| Confirmacao antes de sair do diagnostico | Dados se perdem sem aviso | Media |
| Loading state na landing page | Nao tem skeleton/placeholder durante hydration | Baixa |

### Fluxos quebrados ou frageis

1. **Resultados sem dados:** Se o usuario acessar `/resultados` diretamente, o `useEffect` redireciona para `/diagnostico`. Funciona, mas causa um flash visivel.

2. **Servicos sem diagnostico:** A pagina `/servicos` funciona sem diagnostico (sem destaque), mas o `getRecommendation` e chamado sem config (sem segundo argumento opcional), usando fallbacks hardcoded.

3. **Admin tabs recarregam ao salvar:** Cada tab faz `load()` apos salvar, causando re-fetch de todos os dados e re-render da tabela inteira. Com muitas linhas, isso pode causar perda da posicao de scroll.

### Acessibilidade

| Item | Status |
|---|---|
| `lang="pt-BR"` no HTML | OK |
| `aria-label` em botoes de icone | Parcial (admin tabs nao tem) |
| Contraste de cores (tema escuro) | OK (green #00E85F sobre dark) |
| Navegacao por teclado | Parcial (Radix UI ajuda, mas botoes customizados no diagnostico nao tem `role`) |
| Focus visible | OK (via Tailwind `focus-visible:ring`) |
| Screen reader nos semaforos | Ausente (cores sem texto descritivo para leitores) |

---

## 9. Seguranca

**Classificacao: Critico**

### Autenticacao local (`local-auth.ts`)

| Vulnerabilidade | Severidade | Detalhes |
|---|---|---|
| Senhas hasheadas com SHA-256 simples | **CRITICA** | Sem salt, sem key-stretching. SHA-256 e rapido demais para hashing de senhas. Vulneravel a rainbow tables e brute-force. |
| Sessao armazenada em localStorage | **ALTA** | Nenhuma expiracao de sessao. Uma vez logado, fica logado para sempre. |
| Sem rate limiting no login | **ALTA** | Nenhuma protecao contra brute-force. |
| Usuarios armazenados no localStorage | **ALTA** | Qualquer pessoa com DevTools pode ver/editar credenciais. |
| Sem CSRF/CORS (tudo local) | **MEDIA** | Nao se aplica agora, mas sera critico ao conectar backend. |
| `signUp` aberto | **MEDIA** | Qualquer pessoa pode criar conta admin (restrito apenas ao dominio do email). |

### Dados expostos

| Item | Risco |
|---|---|
| `.env` com chaves Supabase commitado | **ALTO** — embora as chaves sejam anon keys (read-only), nao devem ser commitadas |
| `.env` nao esta no `.gitignore` | **ALTO** — sera commitado no proximo push |
| Dados de pricing no localStorage | **MEDIO** — regras de precificacao visiveis no DevTools |
| Dados de diagnostico no sessionStorage | **BAIXO** — dados do cliente visiveis no DevTools |

### Pontos positivos
- Restricao de signup a `@o2inc.com.br` em `local-auth.ts:33`.
- `ProtectedRoute` verifica `role === "admin"` antes de mostrar conteudo.
- Sem vulnerabilidades XSS obvias (React faz escape por padrao).
- Sem SQL injection (nao usa SQL).

---

## Resumo Executivo

### Mapa de saude por area

| Area | Classificacao | Acao |
|---|---|---|
| Tech Stack | Bom | Manter |
| Estrutura do Projeto | Bom | Manter |
| Features | Bom | Expandir |
| Dependencias | Precisa Melhorar | Limpar deps nao usadas, remover componentes shadcn ociosos |
| Qualidade de Codigo | Precisa Melhorar | Eliminar duplicacoes (formatBRL, Row, Breadcrumbs) |
| Divida Tecnica | **Critico** | Remover camada fake Supabase, limpar heranca Lovable/SSR |
| Performance | Precisa Melhorar | Lazy-load jsPDF, remover recharts, reduzir bundle 60%+ |
| UX | Precisa Melhorar | Persistencia entre sessoes, validacao, responsividade admin |
| Seguranca | **Critico** | Substituir auth local por solucao real antes de ir a producao |

### Top 10 acoes prioritarias

1. **Remover `.env` do controle de versao** e adicionar ao `.gitignore`
2. **Lazy-load jsPDF** (`import()` dinamico) — reduz bundle inicial em ~770 KB
3. **Remover recharts** do `package.json` e deletar `chart.tsx`
4. **Eliminar camada fake Supabase** — admin tabs devem usar `local-store.ts` diretamente
5. **Unificar `formatBRL`** em uma unica exportacao em `lib/utils.ts`
6. **Extrair componente `Row`** compartilhado para as calculadoras
7. **Remover `Breadcrumbs` duplicado** de `SiteHeader.tsx`
8. **Deletar codigo morto** (`error-page.ts`, `error-capture.ts`, `supabase/types.ts`, `supabase/migrations/`, `.lovable/`)
9. **Remover 34 componentes shadcn/ui nao utilizados** e suas dependencias (`date-fns`, `input-otp`, `embla-carousel-react`, etc.)
10. **Substituir React Query** por leitura direta do localStorage (elimina 40KB + complexidade desnecessaria)

### Risco de ir a producao no estado atual

**ALTO.** A autenticacao local e apenas um placeholder para desenvolvimento. Os dados de pricing sao editaveis por qualquer usuario via DevTools. O `.env` com chaves esta exposto. O bundle e 3x maior do que deveria.

Para MVP/demo interno: aceitavel apos resolver itens 1-3.
Para producao real: necessario resolver todos os 10 itens e implementar backend real.
