# PRD de Melhorias — O2 Diagnostico Financeiro

**Data:** 2026-05-15
**Autor:** Morgan (Product Manager Agent)
**Baseado em:** [Avaliacao Brownfield](brownfield-assessment.md) | [Revisao de Arquitetura](architecture-review.md)
**Versao:** 1.0

---

## 1. Visao Geral

O O2 Diagnostico Financeiro e uma ferramenta interna para consultores da O2 Inc que realiza diagnosticos financeiros, calcula precificacao de servicos e gera propostas em PDF. A aplicacao foi migrada de Lovable/Supabase para um SPA puro com localStorage, mas herdou divida tecnica significativa: vulnerabilidades de seguranca criticas (SHA-256 sem salt, `.env` exposto, auto-registro de admin), bundle 3x maior que o necessario (~1.5MB por causa do jsPDF e recharts nao utilizado), camada de compatibilidade Supabase desnecessaria, duplicacao extensiva de codigo (formatBRL em 6 locais, Row em 5 locais), e zero testes automatizados para logica financeira critica. Este PRD define os epicos necessarios para tornar a aplicacao production-ready para uso interno, eliminando vulnerabilidades, reduzindo o bundle, removendo codigo morto e estabelecendo uma base de qualidade com testes.

---

## 2. Metricas de Sucesso

| Metrica | Atual | Alvo |
|---------|-------|------|
| Bundle JS (gzip) | ~450 KB | < 500 KB (idealmente < 200 KB) |
| Vulnerabilidades de seguranca P0 | 3 | 0 |
| Cobertura de testes (logica de negocio) | 0% | > 80% em `results-logic.ts`, `pricing-shared.ts`, `local-store.ts` |
| Duplicacao de codigo | 6x `formatBRL`, 5x `Row`, 2x `Breadcrumbs` | 1x cada (fonte unica) |
| Componentes shadcn nao utilizados | 34 de 47 | 0 nao utilizados |
| Dependencias nao utilizadas | 10+ | 0 |
| Uso de `any` (fora de arquivos gerados) | 10+ ocorrencias | < 3 |

---

## 3. Epicos

### E-001: Hardening de Seguranca

**Prioridade:** P0
**Estimativa:** L (4-8h)
**Dependencias:** Nenhuma

**Justificativa:** A aplicacao possui vulnerabilidades criticas que permitem escalacao de privilegio via DevTools, hashes de senha reversiveis e credenciais expostas no repositorio. Nenhuma dessas falhas e aceitavel mesmo para uso interno.

**Escopo:**
- Adicionar `.env` ao `.gitignore` e remover do historico git com `git filter-branch` ou BFG Repo-Cleaner (Brownfield S9, Arquitetura S9 item 6)
- Substituir SHA-256 puro por `crypto.subtle` com PBKDF2 (100k+ iteracoes) + salt aleatorio em `src/lib/local-auth.ts` (Arquitetura S9 item 1)
- Remover auto-registro de admin: restringir `signUp` para exigir invite code ou seed de primeiro admin apenas (Arquitetura S9 item 4)
- Adicionar TTL na sessao de auth (24h) verificando campo `loggedInAt` em `src/context/AuthContext.tsx` (Arquitetura S4)
- Remover `console.error(error)` do `ErrorComponent` em `src/routes/__root.tsx` para nao expor stack traces em producao (Arquitetura S10)

**Criterios de aceite:**
- `.env` ausente do repositorio e presente no `.gitignore`
- Senhas novas sao hasheadas com PBKDF2 + salt; senhas antigas sao re-hasheadas no proximo login
- Nao e possivel criar conta admin via `/admin/login` sem invite code
- Sessao expira automaticamente apos 24h e usuario e redirecionado ao login
- Console de producao nao exibe stack traces de erros

---

### E-002: Otimizacao de Bundle

**Prioridade:** P0
**Estimativa:** M (2-4h)
**Dependencias:** Nenhuma

**Justificativa:** O bundle atual e ~1.5MB (sem gzip), com jsPDF responsavel por 51% (~772KB). O recharts (300KB) esta no bundle sem ser utilizado. Isso impacta tempo de carregamento, especialmente em redes moveis usadas por consultores em campo.

**Escopo:**
- Lazy-load jsPDF via `import()` dinamico em `src/lib/pdf-export.ts` — carregar apenas quando usuario clica "Exportar PDF" (Brownfield S7 item 1)
- Remover `recharts` do `package.json` e deletar `src/components/ui/chart.tsx` (Brownfield S4, S7 item 2)
- Remover 34 componentes shadcn/ui nao utilizados e seus arquivos em `src/components/ui/`: `accordion`, `alert-dialog`, `alert`, `aspect-ratio`, `avatar`, `badge`, `breadcrumb`, `calendar`, `card`, `carousel`, `collapsible`, `command`, `context-menu`, `dialog`, `drawer`, `dropdown-menu`, `form`, `hover-card`, `input-otp`, `menubar`, `navigation-menu`, `pagination`, `popover`, `resizable`, `scroll-area`, `separator`, `sheet`, `sidebar`, `sonner` (wrapper), `switch`, `table`, `toggle-group`, `toggle` (Brownfield S4)
- Remover dependencias npm orfas apos exclusao dos componentes: `react-day-picker`, `date-fns`, `input-otp`, `embla-carousel-react`, `react-resizable-panels`, `cmdk`, `vaul`, `react-hook-form`, `zod`, `@hookform/resolvers` (Brownfield S4)

**Criterios de aceite:**
- Bundle JS total (gzip) < 200KB no carregamento inicial (sem contar chunks lazy)
- `npm ls recharts` retorna "not found"
- Diretorio `src/components/ui/` contem apenas os 13 componentes utilizados
- `npm audit` e `npm ls` nao reportam dependencias orfas
- Exportar PDF continua funcionando (carrega jsPDF sob demanda)

---

### E-003: Remocao de Codigo Morto

**Prioridade:** P0
**Estimativa:** S (1-2h)
**Dependencias:** Nenhuma

**Justificativa:** O projeto carrega artefatos de tres plataformas anteriores (Lovable, Supabase, TanStack Start SSR) que confundem desenvolvedores, poluem o codebase e podem mascarar bugs reais.

**Escopo:**
- Deletar `src/lib/error-page.ts` — gera HTML SSR, completamente morto em SPA (Brownfield S6)
- Deletar `src/lib/error-capture.ts` — captura erros server-side, morto em SPA (Brownfield S6)
- Deletar `src/integrations/supabase/types.ts` — 672 linhas de tipos Supabase nunca referenciados (Brownfield S6, Arquitetura S6)
- Deletar diretorio `supabase/migrations/` — migracoes SQL mortas (Brownfield S6)
- Deletar `supabase/config.toml` — configuracao morta do Supabase (Brownfield S6)
- Deletar `.lovable/project.json` e diretorio `.lovable/` — metadata do Lovable (Brownfield S6)
- Remover guards `typeof window` desnecessarios em `src/context/DiagnosticContext.tsx` (3x) e `src/components/SiteHeader.tsx` (1x) — window sempre existe em SPA (Brownfield S6)
- Remover regra ESLint `server-only` de `eslint.config.js:27-33` (Brownfield S6)
- Remover entradas `.output` e `.vinxi` do `.gitignore` e `eslint.config.js:9` (Brownfield S6)
- Habilitar `noUnusedLocals: true` e `noUnusedParameters: true` em `tsconfig.json` e corrigir erros resultantes (Brownfield S5)

**Criterios de aceite:**
- Nenhum arquivo referencia Lovable, migracoes SQL, ou SSR
- `grep -r "typeof window" src/` retorna zero resultados
- TypeScript compila sem erros com `noUnusedLocals` e `noUnusedParameters` habilitados
- Build do Vite completa sem warnings

---

### E-004: Deduplicacao de Dados e Codigo

**Prioridade:** P0
**Estimativa:** M (2-4h)
**Dependencias:** Nenhuma

**Justificativa:** Existem 3 fontes da verdade para perguntas e regras de custo (Arquitetura S3 item 1), `formatBRL` definido 6 vezes, componente `Row` definido 5 vezes, e `Breadcrumbs` definido 2 vezes. Isso gera risco real de inconsistencia nos calculos financeiros.

**Escopo:**
- **Unificar `formatBRL`:** Criar exportacao unica em `src/lib/format.ts`, remover definicoes duplicadas de `pricing-shared.ts:57`, `results-logic.ts:228`, `pdf-export.ts:4`, `currency-input.tsx:10`, `calculadora.bpo.tsx:45`, `calculadora.cfo.tsx:24` (Brownfield S5, Arquitetura S7)
- **Unificar `formatDateBR`:** Mover para `src/lib/format.ts`, remover de `diagnostico.tsx:26` e `resultados.tsx:39` (Brownfield S5)
- **Extrair componente `Row`:** Mover para `src/components/calc-ui.tsx` (que ja existe com `CalcLoadingSkeleton`), remover definicoes de `calculadora.oxy.tsx:173`, `calculadora.bpo.tsx:261`, `calculadora.cfo.tsx:285`, `calculadora.assessoria.tsx:158`, `calculadora.coordenador.tsx:165` (Brownfield S5, Arquitetura S7)
- **Unificar `Breadcrumbs`:** Manter `src/components/Breadcrumbs.tsx`, remover implementacao duplicada de `src/components/SiteHeader.tsx:95` (Brownfield S5, Arquitetura S7)
- **Fonte unica para perguntas:** `src/lib/diagnostic-questions.ts` e fallbacks em `src/lib/results-logic.ts` devem ler de `seed-data.ts` ou do local-store, eliminando copias hardcoded (Arquitetura S3 item 1)

**Criterios de aceite:**
- `grep -r "formatBRL" src/ | grep -c "function\|const formatBRL\|= ("` retorna exatamente 1
- `grep -r "formatDateBR" src/ | grep -c "function\|const formatDateBR"` retorna exatamente 1
- `grep -r "function Row\|const Row" src/ | grep -v node_modules` retorna exatamente 1 (em `calc-ui.tsx`)
- Perguntas do diagnostico sao carregadas de uma unica fonte (local-store com fallback para seed-data)
- Todas as calculadoras e resultados continuam funcionando identicamente

---

### E-005: Remocao da Facade Supabase

**Prioridade:** P1
**Estimativa:** L (4-8h)
**Dependencias:** E-003 (types.ts ja deletado)

**Justificativa:** A camada de compatibilidade Supabase (`src/integrations/supabase/client.ts`) adiciona complexidade desnecessaria: operacoes sincronas fingindo ser assincronas, `any` extensivo, e uma cadeia de 3 camadas (facade -> local-store -> localStorage) quando 1 bastaria.

**Escopo:**
- Refatorar `src/hooks/use-pricing.ts`: substituir chamadas via `supabase.from()` por chamadas diretas a `local-store.ts` (`selectAll`, `insertRows`, `updateRow`, `deleteRow`) (Arquitetura S6)
- Refatorar admin tabs (`src/components/admin/QuestionsTab.tsx`, `CostsTab.tsx`, `MaturityTab.tsx`, `RecommendationsTab.tsx`, `BpoTab.tsx`, `CfoTab.tsx`, `OtherCalcTab.tsx`): substituir imports de `@/integrations/supabase/client` por `@/lib/local-store` (Arquitetura S6)
- Deletar `src/integrations/supabase/client.ts` — o QueryBuilder inteiro (Arquitetura S6)
- Deletar diretorio `src/integrations/` se vazio apos remocao (Brownfield S6)
- Adicionar tipos genericos ao `local-store.ts` usando interfaces existentes de `use-pricing.ts` (Arquitetura S6)

**Criterios de aceite:**
- Zero imports de `@/integrations/supabase` em todo o projeto
- Diretorio `src/integrations/` nao existe mais
- Admin panel funciona normalmente: CRUD em todas as 7 tabs
- Calculadoras e resultados carregam dados corretamente
- Zero uso de `any` nas chamadas ao local-store

---

### E-006: Melhorias do Admin

**Prioridade:** P1
**Estimativa:** L (4-8h)
**Dependencias:** E-005 (facade removida antes de abstrair CRUD)

**Justificativa:** Os 7 admin tabs reimplementam o mesmo padrao CRUD (~600+ linhas duplicadas), a protecao de rota e feita no componente ao inves do router (carregando codigo admin antes de verificar auth), e alteracoes no admin nao refletem nas calculadoras ate o cache do React Query expirar.

**Escopo:**
- **Hook `useCrudTable<T>`:** Criar hook generico em `src/hooks/use-crud-table.ts` que encapsule load/update/add/remove/save/dirty-tracking, extraindo padrao comum dos admin tabs (Arquitetura S7)
- **Cache invalidation:** Chamar `queryClient.invalidateQueries()` apos operacoes de escrita nos admin tabs — ou substituir React Query por leitura direta (ver E-009) (Arquitetura S3 item 2)
- **Protecao de rota no router:** Mover `ProtectedRoute` de componente wrapper para `beforeLoad` do TanStack Router com `redirect`, evitando carregamento do bundle admin sem autenticacao (Arquitetura S5)
- Adicionar `QuotaExceededError` handling no `local-store.ts` com alerta ao usuario (Arquitetura S8)

**Criterios de aceite:**
- Admin tabs usam `useCrudTable` — codigo de state management nao e duplicado entre tabs
- Alteracoes salvas no admin sao imediatamente refletidas nas calculadoras (sem esperar cache expirar)
- Acessar `/admin` sem autenticacao redireciona ao login SEM carregar o chunk do admin
- Tentar salvar dados quando localStorage esta cheio mostra mensagem de erro clara ao usuario

---

### E-007: Fundacao de Testes

**Prioridade:** P1
**Estimativa:** L (4-8h)
**Dependencias:** E-004 (codigo deduplicado para testar fontes unicas)

**Justificativa:** A aplicacao calcula precificacao financeira e gera propostas comerciais sem nenhum teste automatizado. Qualquer regressao em `pricing-shared.ts` ou `results-logic.ts` pode gerar propostas com valores errados para clientes.

**Escopo:**
- Configurar Vitest + Testing Library no projeto: `vitest.config.ts`, scripts npm `test` e `test:coverage` (Arquitetura S10)
- Testes unitarios para `src/lib/pricing-shared.ts`: todos os cenarios de calculo de BPO, CFO, Oxy, Assessoria, Coordenador (Arquitetura S10)
- Testes unitarios para `src/lib/results-logic.ts`: calculo de score, maturidade, estimativa de perdas, recomendacoes (Arquitetura S10)
- Testes unitarios para `src/lib/local-store.ts`: CRUD operations, seed data initialization, edge cases (chaves inexistentes, dados corrompidos) (Arquitetura S10)
- Testes unitarios para `src/lib/local-auth.ts`: hash com PBKDF2 (pos E-001), validacao de dominio, TTL de sessao (Arquitetura S10)
- Testes para `src/lib/format.ts` (pos E-004): `formatBRL`, `formatDateBR` com edge cases

**Criterios de aceite:**
- `npm test` roda com sucesso
- Cobertura > 80% em `pricing-shared.ts`, `results-logic.ts`, `local-store.ts`
- CI pode ser configurado para rodar testes (script npm padrao)
- Todos os cenarios de precificacao documentados no seed-data possuem teste correspondente

---

### E-008: Melhorias de UX

**Prioridade:** P2
**Estimativa:** L (4-8h)
**Dependencias:** E-005 (admin usa local-store direto para export/import)

**Justificativa:** Consultores perdem dados do diagnostico ao fechar a aba (sessionStorage), nao ha backup dos dados do admin, e o painel admin nao e responsivo em mobile. Essas limitacoes impactam a produtividade diaria dos consultores.

**Escopo:**
- **Persistencia do diagnostico:** Migrar `DiagnosticContext` de `sessionStorage` para `localStorage` com chave dedicada, permitindo retomar diagnostico entre sessoes. Adicionar botao "Limpar e comecar novo" (Brownfield S8)
- **Export/import admin:** Adicionar funcoes de export (JSON) e import de todos os dados do admin no painel, permitindo backup manual e transferencia entre maquinas (Arquitetura S2, S8)
- **Responsividade admin:** Tornar tabelas do admin responsivas em mobile com scroll horizontal ou layout empilhado (Brownfield S8)
- **Confirmacao antes de sair do diagnostico:** Adicionar `beforeunload` event e/ou prompt ao navegar para fora durante diagnostico em andamento (Brownfield S8)
- **Acessibilidade dos semaforos:** Adicionar texto descritivo para screen readers nas cores do diagnostico (Brownfield S8)

**Criterios de aceite:**
- Diagnostico em andamento persiste ao fechar e reabrir a aba
- Admin pode exportar todos os dados para arquivo JSON e importar de volta
- Tabelas admin sao utilizaveis em tela de 375px (iPhone SE)
- Navegar para fora do diagnostico com respostas preenchidas exibe confirmacao
- Semaforos possuem `aria-label` descritivo

---

### E-009: Limpeza de Arquitetura

**Prioridade:** P2
**Estimativa:** XL (8h+)
**Dependencias:** E-005, E-006

**Justificativa:** A arquitetura carrega complexidade herdada: React Query wrapper para dados sincronos, flat routing sem layouts compartilhados, e uso extensivo de `any`. Simplificar esses pontos reduz custo de manutencao e melhora developer experience.

**Escopo:**
- **Reduzir/remover React Query:** Substituir `use-pricing.ts` por leitura direta do `local-store.ts` com estado local (useState/useReducer). Remover `QueryClientProvider` do `__root.tsx` e `@tanstack/react-query` do `package.json` se nenhum outro uso existir (Brownfield S6, Arquitetura S3)
- **Layout routes:** Criar `src/routes/admin.tsx` (layout compartilhado para rotas admin com header e protecao) e `src/routes/calculadora.tsx` (layout compartilhado com breadcrumb e "Voltar aos Servicos") (Arquitetura S5)
- **Reduzir `any`:** Tipar dados nos admin components usando interfaces existentes (`DiagnosticQuestion`, `CostParameter`, `BPOPackage`, etc.) de `use-pricing.ts`. Alvo: < 3 ocorrencias de `any` fora de `routeTree.gen.ts` (Brownfield S5, Arquitetura S10)
- **Resolver eslint-disable:** Corrigir os 5 `eslint-disable-next-line react-hooks/exhaustive-deps` nas calculadoras, refatorando useEffects para ter dependencias corretas (Brownfield S5)
- **Corrigir `useMemo` anti-pattern:** Substituir `useMemo(() => new Map(), [])` por `useRef(new Map())` nos admin tabs (Brownfield S5)
- **Decompor rotas grandes:** Quebrar `diagnostico.tsx` (354 linhas) em `DiagnosticScreen1`, `DiagnosticScreen2`, `DiagnosticScreen3` (Arquitetura S7)

**Criterios de aceite:**
- `npm ls @tanstack/react-query` retorna "not found" (ou justificativa documentada para manter)
- Rotas `/admin/*` compartilham layout via `admin.tsx`
- Rotas `/calculadora/*` compartilham layout via `calculadora.tsx`
- `grep -r "as any" src/ | grep -v routeTree` retorna < 3 resultados
- Zero `eslint-disable` comments no codigo fonte (exceto arquivos gerados)
- Build limpo sem warnings

---

## 4. Roadmap

### Fase A — Imediata (pode fazer deploy apos concluir)

| Epico | Titulo | Estimativa | Pode paralelizar com |
|-------|--------|------------|---------------------|
| E-001 | Hardening de Seguranca | L (4-8h) | E-002, E-003, E-004 |
| E-002 | Otimizacao de Bundle | M (2-4h) | E-001, E-003, E-004 |
| E-003 | Remocao de Codigo Morto | S (1-2h) | E-001, E-002, E-004 |
| E-004 | Deduplicacao de Dados e Codigo | M (2-4h) | E-001, E-002, E-003 |

**Total estimado:** 11-16h (8-10h se paralelizados)
**Resultado:** Aplicacao segura, leve e sem codigo morto. Aceitavel para uso interno.

### Fase B — Curto prazo (qualidade e manutenibilidade)

| Epico | Titulo | Estimativa | Depende de |
|-------|--------|------------|------------|
| E-005 | Remocao da Facade Supabase | L (4-8h) | E-003 |
| E-006 | Melhorias do Admin | L (4-8h) | E-005 |
| E-007 | Fundacao de Testes | L (4-8h) | E-004 |

**Total estimado:** 12-24h
**Resultado:** Codigo limpo, testado e sem abstracoes desnecessarias.

### Fase C — Medio prazo (polimento e escala)

| Epico | Titulo | Estimativa | Depende de |
|-------|--------|------------|------------|
| E-008 | Melhorias de UX | L (4-8h) | E-005 |
| E-009 | Limpeza de Arquitetura | XL (8h+) | E-005, E-006 |

**Total estimado:** 12-16h+
**Resultado:** Aplicacao polida, arquitetura simplificada, pronta para evolucoes futuras.

---

## 5. Fora de Escopo

Os itens abaixo estao **explicitamente excluidos** deste PRD:

- **Backend / API REST:** A aplicacao continuara como SPA com localStorage. Implementacao de backend sera tratada em PRD separado quando necessario.
- **Sincronizacao multi-usuario:** Dados permanecem locais por navegador. Consolidacao de diagnosticos entre consultores requer backend.
- **SSO / Google Workspace:** Integracao com SSO corporativo (@o2inc.com.br) e desejavel mas requer infraestrutura de backend.
- **Aplicativo mobile nativo:** O app e web-only. Responsividade mobile (E-008) cobre o uso em navegador mobile.
- **Migracao para IndexedDB:** Avaliada como P2 na revisao de arquitetura, mas o volume de dados atual nao justifica a complexidade. Sera reavaliada se `QuotaExceededError` se tornar recorrente.
- **Error tracking (Sentry/LogRocket):** Requer conta e configuracao de servico externo. Sera tratado quando houver infraestrutura de observabilidade.
- **Internacionalizacao (i18n):** A aplicacao e exclusivamente em pt-BR para o mercado brasileiro.
- **Criptografia de dados no localStorage:** Avaliada como P2 na revisao de seguranca. Para uso interno com maquinas corporativas, o risco e aceitavel.

---

## 6. Validacao do PO

**Data:** 2026-05-15
**Revisor:** Pax (Product Owner Agent)
**Veredicto:** APROVADO COM ALTERACOES

---

### 6.1 Analise por Epico

| ID | Status | Nota |
|----|--------|------|
| E-001 | ALTERACAO | Faltam 2 itens P0: (1) sessao editavel no localStorage permite escalacao de privilegio trivial — TTL nao resolve isso, precisa de HMAC ou assinatura; (2) sem rate limiting no login (severidade ALTA no Brownfield S9). Ambos devem entrar neste epico. |
| E-002 | OK | Escopo correto, cobertura completa. Estimativa M (2-4h) e realista. Criterio de aceite "< 200KB gzip" e ambicioso mas alcancavel com lazy jsPDF + remocao do recharts. |
| E-003 | OK | Escopo correto e bem delimitado. Estimativa S (1-2h) e realista. Criterios de aceite verificaveis via grep. |
| E-004 | OK | Boa cobertura das duplicacoes. Criterios de aceite com comandos grep sao excelentes — objetivos e automatizaveis. |
| E-005 | OK | Dependencia de E-003 esta correta. Escopo claro. Estimativa L (4-8h) e realista dado o numero de admin tabs a refatorar. |
| E-006 | ALTERACAO | `QuotaExceededError` foi classificado como P0 na Architecture Review (S8/S11 item 5) mas esta neste epico P1. Mover o tratamento de `QuotaExceededError` para E-001 ou E-004 (Fase A). O resto do epico esta OK como P1. |
| E-007 | ALTERACAO | A Architecture Review classifica testes como P0 (S10, S11 item 4): "logica de pricing financeiro sem validacao automatizada". Concordo com a reclassificacao para P0. Testes devem acompanhar a Fase A para garantir que refatoracoes nao quebrem calculos. A dependencia de E-004 esta correta. |
| E-008 | OK | Escopo adequado para P2. Export/import de dados e a feature de maior valor aqui. |
| E-009 | OK | Escopo XL (8h+) e realista para a quantidade de refatoracao. Dependencias corretas. |

---

### 6.2 Gaps Identificados

| # | Origem | Descricao | Acao |
|---|--------|-----------|------|
| G1 | Arq. S9 item 3 | Sessao editavel no localStorage permite escalacao de privilegio (mudar role para "admin" via DevTools). TTL sozinho nao resolve. Necessario HMAC ou assinatura no JSON da sessao. | Adicionar ao E-001 |
| G2 | Brownfield S9 | Sem rate limiting no login — brute-force possivel. | Adicionar ao E-001 (rate limit simples com contador no localStorage: 5 tentativas, lockout de 5min) |
| G3 | Arq. S11 item 5 | `QuotaExceededError` classificado P0 no assessment mas colocado em E-006 (P1). | Mover para E-004 (ja mexe no local-store) |
| G4 | Arq. S4 | Sincronizacao de logout entre abas (escutar evento `storage`). | Adicionar ao E-001 (escopo de sessao/auth) |
| G5 | Arq. S8 | Limpeza de logs de auditoria antigos (manter 30 dias). | Adicionar ao E-008 (UX/manutencao de dados) |
| G6 | Brownfield S5 item 4 | `useCountUp` chamado condicionalmente em `resultados.tsx:222` — viola regra de hooks. | Adicionar ao E-009 (limpeza de arquitetura) |
| G7 | Arq. S10 | Testes classificados como P0 no assessment, mas E-007 esta como P1 no PRD. | Reclassificar E-007 para P0 |

---

### 6.3 Alteracoes nos Epicos

#### E-001: Hardening de Seguranca — Escopo Ampliado

Adicionar ao escopo existente:

- Assinar JSON da sessao com HMAC usando chave derivada, impedindo edicao manual do role via DevTools (Arq. S9 item 3)
- Implementar rate limiting no login: maximo 5 tentativas por email em janela de 5 minutos, com lockout e mensagem ao usuario (Brownfield S9)
- Escutar evento `storage` no `AuthContext` para sincronizar logout entre abas (Arq. S4)

Adicionar aos criterios de aceite:

- Editar manualmente o JSON da sessao no localStorage invalida a sessao no proximo carregamento
- Apos 5 tentativas de login com senha errada, o formulario bloqueia por 5 minutos com mensagem clara
- Fazer logout em uma aba faz logout automatico em outras abas abertas

**Estimativa revisada:** XL (8h+) — o escopo original ja era L (4-8h), os 3 itens adicionais justificam a reclassificacao.

#### E-004: Deduplicacao — Adicionar QuotaExceededError

Adicionar ao escopo:

- Implementar `try/catch` em torno de `localStorage.setItem` no `local-store.ts` para capturar `QuotaExceededError` e mostrar alerta ao usuario (Arq. S8 P0)

Adicionar aos criterios de aceite:

- Quando localStorage esta cheio, operacoes de escrita mostram mensagem de erro clara em vez de falhar silenciosamente

**Estimativa revisada:** M (2-4h) — sem alteracao, o item adicional e pequeno.

#### E-007: Fundacao de Testes — Reclassificado para P0

**Prioridade:** P0 (era P1)
**Justificativa da mudanca:** A Architecture Review classifica explicitamente como P0. A aplicacao calcula valores financeiros para propostas comerciais — uma regressao silenciosa pode gerar propostas com precos errados para clientes. Os epicos E-001 a E-004 fazem refatoracoes extensas; testes devem existir ANTES ou EM PARALELO para validar que nada quebrou.

**Dependencia revisada:** E-004 (mantem). Porem, a configuracao do Vitest (sem testes de negocio) pode comecar em paralelo com Fase A.

#### E-008: Melhorias de UX — Adicionar Limpeza de Audit Logs

Adicionar ao escopo:

- Implementar limpeza automatica de logs de auditoria com mais de 30 dias no `admin-audit.ts` (Arq. S8)

#### E-009: Limpeza de Arquitetura — Adicionar Fix useCountUp

Adicionar ao escopo:

- Corrigir `useCountUp` chamado condicionalmente em `resultados.tsx:222` — extrair para componente dedicado que respeite a regra de hooks (Brownfield S5 item 4)

---

### 6.4 Validacao de Dependencias e Paralelizacao

| Claim do PRD | Veredicto | Nota |
|--------------|-----------|------|
| E-001, E-002, E-003, E-004 podem paralelizar | OK | Nenhum toca nos mesmos arquivos de forma conflitante. E-001 mexe em auth/env, E-002 em bundle/deps, E-003 em arquivos mortos, E-004 em utils/format. Worktrees separados funcionam. |
| E-005 depende de E-003 | OK | E-003 deleta `types.ts`; E-005 deleta `client.ts` e refatora imports. Ordem correta. |
| E-006 depende de E-005 | OK | Faz sentido abstrair CRUD depois que a facade foi removida. |
| E-007 depende de E-004 | OK | Testar fontes unicas apos deduplicacao e correto. |
| E-008 depende de E-005 | FRACO | A dependencia e parcial (apenas export/import precisa do local-store direto). Persistencia do diagnostico, responsividade e acessibilidade nao dependem de E-005. Considerar dividir ou relaxar a dependencia. |
| E-009 depende de E-005 e E-006 | OK | Remover React Query e criar layouts faz sentido apos a limpeza da facade e do CRUD. |
| E-007 (agora P0) em paralelo com Fase A | VIAVEL | Setup do Vitest em paralelo. Testes de negocio apos E-004. |

---

### 6.5 Validacao de Estimativas

| Epico | Estimativa Original | Estimativa Revisada | Nota |
|-------|---------------------|---------------------|------|
| E-001 | L (4-8h) | XL (8h+) | Escopo ampliado com HMAC, rate limiting e sync entre abas. 10-12h realista. |
| E-002 | M (2-4h) | M (2-4h) | OK. Remocao de deps e lazy import sao tarefas mecanicas. |
| E-003 | S (1-2h) | S (1-2h) | OK. Deletar arquivos e grep para confirmar. |
| E-004 | M (2-4h) | M (2-4h) | OK. QuotaExceededError adiciona ~30min. |
| E-005 | L (4-8h) | L (4-8h) | OK. 7 tabs + hooks para refatorar. |
| E-006 | L (4-8h) | L (4-8h) | OK. Hook generico + route guard + cache invalidation. |
| E-007 | L (4-8h) | L (4-8h) | OK. Setup Vitest + testes para 4 modulos core. |
| E-008 | L (4-8h) | L (4-8h) | OK. 5 features independentes de complexidade moderada. |
| E-009 | XL (8h+) | XL (8h+) | OK. Escopo grande mas bem definido. 10-14h realista. |

**Total revisado:** ~48-60h (era ~35-48h). Aumento de ~35% devido ao escopo de seguranca ampliado e testes como P0.

---

### 6.6 Backlog Priorizado Final

#### Fase A — Imediata (P0 — bloqueia producao)

| Ordem | Epico | Titulo | Estimativa | Paraleliza com |
|-------|-------|--------|------------|----------------|
| 1 | E-003 | Remocao de Codigo Morto | S (1-2h) | E-001, E-002, E-004 |
| 2 | E-002 | Otimizacao de Bundle | M (2-4h) | E-001, E-003, E-004 |
| 3 | E-004 | Deduplicacao + QuotaExceededError | M (2-4h) | E-001, E-002, E-003 |
| 4 | E-001 | Hardening de Seguranca (ampliado) | XL (8-12h) | E-002, E-003, E-004 |
| 5 | E-007 | Fundacao de Testes | L (4-8h) | Setup em paralelo; testes apos E-004 |

**Total Fase A:** ~17-28h (12-16h se paralelizados com 2 devs)
**Gate:** Deploy somente apos TODOS os 5 epicos concluidos e testes passando.

#### Fase B — Curto prazo (P1 — qualidade e manutenibilidade)

| Ordem | Epico | Titulo | Estimativa | Depende de |
|-------|-------|--------|------------|------------|
| 6 | E-005 | Remocao da Facade Supabase | L (4-8h) | E-003 |
| 7 | E-006 | Melhorias do Admin | L (4-8h) | E-005 |

**Total Fase B:** 8-16h

#### Fase C — Medio prazo (P2 — polimento)

| Ordem | Epico | Titulo | Estimativa | Depende de |
|-------|-------|--------|------------|------------|
| 8 | E-008 | Melhorias de UX | L (4-8h) | E-005 (parcial) |
| 9 | E-009 | Limpeza de Arquitetura | XL (8h+) | E-005, E-006 |

**Total Fase C:** 12-16h+

---

### 6.7 Notas Finais

1. **Seguranca e a prioridade maxima.** O `.env` exposto e o SHA-256 sem salt sao vulnerabilidades que devem ser corrigidas antes de qualquer outro trabalho. O escopo ampliado de E-001 reflete isso.

2. **Testes nao sao luxo, sao prerequisito.** Mover E-007 para P0 e essencial. Os epicos E-001 a E-004 fazem refatoracoes extensas em codigo de calculo financeiro. Sem testes, nao ha como garantir que propostas comerciais continuam corretas.

3. **A estimativa total subiu ~35%** com as mudancas propostas. Isso e aceitavel — o PRD original subestimava o escopo de seguranca e ignorava a necessidade de testes na Fase A.

4. **E-008 tem dependencia fraca de E-005.** Recomendo que itens independentes (persistencia do diagnostico, responsividade, acessibilidade) possam ser implementados em paralelo com a Fase B, sem esperar E-005.

5. **O PRD esta bem estruturado.** Criterios de aceite com comandos grep sao excelentes — objetivos, automatizaveis e sem ambiguidade. As metricas de sucesso sao claras. A secao de fora de escopo e completa e bem justificada.

---

*Validacao realizada por Pax — Product Owner Agent.*
*Data: 2026-05-15.*

---

*Documento gerado por Morgan — Product Manager Agent.*
*Baseado nas analises de Atlas (Business Analyst) e Aria (System Architect) em 2026-05-15.*
