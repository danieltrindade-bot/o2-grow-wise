# Revisao de Arquitetura -- O2 Diagnostico

**Data:** 2026-05-15
**Revisor:** Aria (System Architect Agent)
**Versao do projeto:** SPA puro (pos-migracao de Lovable/Supabase/TanStack Start SSR)

---

## 1. Diagrama de Arquitetura Atual

```
+------------------------------------------------------------------+
|                         BROWSER                                   |
|                                                                   |
|  +------------------+    +------------------------------------+   |
|  |    main.tsx       |    |          __root.tsx                 |   |
|  |  createRoot()     |--->| QueryClientProvider                |   |
|  |  RouterProvider   |    | AuthProvider                       |   |
|  +------------------+    | DiagnosticProvider                  |   |
|                          |   +-- Outlet (rotas filhas)         |   |
|                          +------------------------------------+   |
|                                        |                          |
|            +---------------------------+-------------------+      |
|            |                           |                   |      |
|    +-------v--------+    +-------------v---+   +-----------v--+   |
|    | Rotas Publicas  |    | Rotas Calc.     |   | Rotas Admin  |   |
|    | /               |    | /calculadora/*  |   | /admin/*     |   |
|    | /diagnostico    |    |                 |   | (Protected)  |   |
|    | /resultados     |    +---------+-------+   +------+-------+   |
|    | /servicos       |              |                  |           |
|    +-------+---------+              |                  |           |
|            |                        |                  |           |
|            +----------+-------------+------------------+           |
|                       |                                            |
|              +--------v----------+                                 |
|              |  use-pricing.ts   |  (TanStack Query hooks)         |
|              |  useBPOPricing()  |                                 |
|              |  useCFOPricing()  |                                 |
|              |  useDiagConfig()  |                                 |
|              +--------+----------+                                 |
|                       |                                            |
|              +--------v----------+                                 |
|              |  supabase/client  |  (QueryBuilder facade)          |
|              |  .from(table)     |                                 |
|              |  .select/.insert  |                                 |
|              +--------+----------+                                 |
|                       |                                            |
|              +--------v----------+                                 |
|              |  local-store.ts   |  (CRUD sobre localStorage)      |
|              |  selectAll()      |                                 |
|              |  insertRows()     |                                 |
|              |  updateRow()      |                                 |
|              +--------+----------+                                 |
|                       |                                            |
|    +---------+--------v---------+-------+                          |
|    |   localStorage             |       |                          |
|    |   o2-data-*   (seed data)  |       |                          |
|    |   o2-auth-*   (credenciais)|       |                          |
|    |   o2-diagnostic-state      |       |                          |
|    |   (sessionStorage)         |       |                          |
|    +----------------------------+-------+                          |
+------------------------------------------------------------------+
```

### Fluxo de dados resumido

```
seed-data.ts (defaults hardcoded)
       |
       v
local-store.ts (lazy-init no primeiro acesso)
       |
       v
supabase/client.ts (QueryBuilder -> simula API Supabase)
       |
       v
use-pricing.ts (React Query hooks com staleTime 5min)
       |
       v
Componentes de rota (renderizam dados)
```

---

## 2. Padroes de Arquitetura (SPA + localStorage)

### Pontos fortes

- **Zero infraestrutura de backend**: Deploy e operacao extremamente simples. Pode ser hospedado em qualquer CDN/S3.
- **Latencia zero**: Todas as leituras sao sincronas no localStorage; a UX e instantanea.
- **Modelo de dados imutavel por padrao**: Os seed data garantem que a app nunca inicializa vazia.
- **Autonomia total do consultor**: Cada consultor tem seu proprio "banco de dados" no navegador, sem depender de servidor.

### Pontos fracos

- **Dados nao persistem entre dispositivos/navegadores**: Se o consultor troca de maquina ou limpa cache, perde tudo.
- **Sem auditoria real**: Logs de auditoria ficam tambem no localStorage -- podem ser apagados pelo usuario.
- **Sem backup automatico**: Nao ha mecanismo de exportar/importar os dados do admin.
- **Limite de 5MB do localStorage**: Em cenarios com muitos diagnosticos ou tabelas de pricing extensas, pode estourar silenciosamente.

### Recomendacoes

| Prio | Acao |
|------|------|
| P1 | Implementar export/import de dados do admin (JSON) para backup manual |
| P1 | Adicionar tratamento de erro para `QuotaExceededError` no `local-store.ts` |
| P2 | Avaliar IndexedDB como alternativa ao localStorage (limite muito maior, ~50MB+) |
| P2 | Documentar claramente que dados sao locais e nao sincronizam entre dispositivos |

---

## 3. Fluxo de Dados

### Analise

O fluxo `localStorage -> local-store -> QueryBuilder -> React Query -> componentes` funciona, mas tem uma camada de indirectao desnecessaria (ver secao 6).

**Problemas identificados:**

1. **Duplicacao de dados de fallback**: `diagnostic-questions.ts` e `results-logic.ts` possuem copias hardcoded dos mesmos dados que existem em `seed-data.ts`. Sao 3 fontes da verdade para as mesmas perguntas e regras de custo.

2. **React Query com staleTime em dados locais**: O `staleTime: 5 * 60 * 1000` (5 minutos) faz sentido para chamadas de rede, mas para dados locais e contra-produtivo. Se o admin altera um valor no painel, o cache do React Query nao invalida automaticamente, e as calculadoras continuam mostrando o valor antigo ate o stale expirar.

3. **DiagnosticContext usa sessionStorage, admin usa localStorage**: Decisao acertada (diagnostico e efemero, configuracao persiste), mas nao esta documentada.

### Recomendacoes

| Prio | Acao |
|------|------|
| P0 | Eliminar duplicacao: `diagnostic-questions.ts` e os fallbacks em `results-logic.ts` devem ler de `seed-data.ts` ou do local-store, nunca ter copias hardcoded |
| P1 | Invalida cache do React Query apos operacoes de escrita no admin (chamar `queryClient.invalidateQueries()`) |
| P2 | Reduzir staleTime para 0 ou 30s ja que a leitura e local e instantanea |

---

## 4. Gerenciamento de Estado

### AuthContext

**Pontos fortes:**
- Interface limpa e minima (`user`, `role`, `loading`, `signIn`, `signUp`, `signOut`)
- Carregamento inicial sincrono com `getCurrentUser()` no `useEffect`

**Pontos fracos:**
- Sem expirar sessao: Uma sessao criada nunca expira. O campo `loggedInAt` existe mas nunca e verificado.
- Sem protecao contra sessao em outra aba: Se o usuario faz logout numa aba, a outra aba continua autenticada.

### DiagnosticContext

**Pontos fortes:**
- Validacao de schema com `isValid()` ao restaurar do sessionStorage
- Navegacao por telas (`goTo`) e reset encapsulados

**Pontos fracos:**
- O `setState` e uma funcao de merge raso (`...prev, ...partial`). Se um consumidor acidentalmente passar `answers: {}`, apaga todas as respostas.
- Sem undo/redo -- o consultor pode perder respostas acidentalmente.

### Recomendacoes

| Prio | Acao |
|------|------|
| P1 | Adicionar TTL na sessao de auth (ex: 24h) verificando `loggedInAt` |
| P1 | Escutar evento `storage` para sincronizar logout entre abas |
| P2 | Considerar `useReducer` no DiagnosticContext para acoes mais explicitas e prevenir estados invalidos |

---

## 5. Arquitetura de Rotas

### Pontos fortes

- **File-based routing** com TanStack Router: Convencao clara, rotas geradas automaticamente.
- **Code splitting automatico**: `autoCodeSplitting: true` no Vite plugin garante lazy loading por rota.
- **Scroll restoration**: Configurado no router.
- **Error boundary e 404**: Tratados no `__root.tsx` com componentes dedicados.

### Pontos fracos

- **Protecao de rota no componente, nao no router**: O `ProtectedRoute` e um componente wrapper dentro do `admin.index.tsx`. Isso significa que o codigo do admin JA FOI carregado quando a protecao roda. O correto seria usar `beforeLoad` do TanStack Router para redirecionar antes de renderizar.
- **Sem layout route para `/admin`**: As rotas admin usam flat routing (`admin.index.tsx`, `admin.login.tsx`) sem um layout compartilhado. Funciona, mas o header do admin e repetido.
- **Sem layout route para `/calculadora`**: Cada calculadora reimplementa o breadcrumb e link "Voltar aos Servicos".

### Recomendacoes

| Prio | Acao |
|------|------|
| P1 | Mover protecao de rota para `beforeLoad` no router, usando `redirect` do TanStack Router |
| P2 | Criar layout route `admin.tsx` para encapsular header e protecao compartilhados |
| P2 | Criar layout route `calculadora.tsx` para breadcrumb e navegacao compartilhados |

---

## 6. Supabase Facade (QueryBuilder)

### Analise detalhada

O arquivo `src/integrations/supabase/client.ts` implementa um `QueryBuilder` que simula a API do Supabase (`from().select().eq().order()`) sobre o localStorage. Isso foi claramente feito para minimizar mudancas durante a migracao de Supabase para SPA local.

**Pontos fortes:**
- Permitiu uma migracao rapida: os hooks e componentes admin mal precisaram mudar.
- A interface `.then()` permite uso com `await`, simulando chamadas assincronas.

**Pontos fracos:**
- **Complexidade desnecessaria**: A app ja nao usa Supabase. Manter uma facade que simula uma API de banco remoto sobre localStorage e over-engineering para o caso atual.
- **Type safety perdida**: A facade usa `any` extensivamente. O `supabase.from("diagnostic_questions")` nao tem type checking -- qualquer string e aceita.
- **Operacoes sincronas fingindo ser assincronas**: O `QueryBuilder.then()` wrappa operacoes sincronas em `Promise.resolve()`, adicionando overhead de microtask desnecessario.
- **Arquivo de tipos legado**: `integrations/supabase/types.ts` (672 linhas) ainda define o schema completo do Supabase com tipos para Row/Insert/Update, mas NENHUM desses tipos e realmente usado. Os tipos das entidades estao redefinidos em `use-pricing.ts` e `seed-data.ts`.

**Veredicto: A facade deve ser removida.**

### Recomendacoes

| Prio | Acao |
|------|------|
| P1 | Refatorar: fazer hooks em `use-pricing.ts` chamarem `local-store.ts` diretamente, sem passar pelo QueryBuilder |
| P1 | Remover `integrations/supabase/client.ts` e `integrations/supabase/types.ts` |
| P1 | Nos componentes admin (`QuestionsTab`, `BpoTab`, etc.), substituir `supabase.from()` por chamadas diretas ao `local-store` |
| P2 | Adicionar tipos genericos ao `local-store.ts` usando as interfaces ja existentes em `use-pricing.ts` |

**Exemplo de como ficaria:**

```typescript
// Antes (via facade)
const { data, error } = await supabase
  .from("diagnostic_questions")
  .select("*")
  .order("global_order");

// Depois (direto)
const data = selectAll<DiagnosticQuestion>("diagnostic_questions", "global_order");
```

---

## 7. Arquitetura de Componentes

### Pontos fortes

- **shadcn/ui bem aplicado**: Componentes primitivos (Button, Input, Select, Tabs) usados consistentemente.
- **Componentes de utilidade reutilizaveis**: `CalcLoadingSkeleton`, `ErrorState`, `useCountUp` -- bons patterns.
- **Separacao clara**: Componentes admin em pasta dedicada, UI em `/ui`.
- **Exportacao PDF**: Funcionalidade de exportacao bem encapsulada em `pdf-export.ts`.

### Pontos fracos

- **Componentes de rota muito grandes**: `diagnostico.tsx` (354 linhas), `calculadora.cfo.tsx` (293 linhas), `calculadora.bpo.tsx` (269 linhas) concentram logica de negocio, estado local e UI numa unica funcao. Deveriam ser decompostos.
- **Duplicacao de funcao `formatBRL`**: Definida em 4 lugares diferentes (`results-logic.ts`, `pricing-shared.ts`, `calculadora.bpo.tsx`, `calculadora.cfo.tsx`). Deveria ter uma unica fonte.
- **Duplicacao de `Row` component**: O componente `Row` (label + value) e reimplementado identicamente em `calculadora.bpo.tsx` e `calculadora.cfo.tsx`.
- **`Breadcrumbs` duplicado**: Existe em `SiteHeader.tsx` (linhas 95-112) E em `Breadcrumbs.tsx`. Dois componentes de breadcrumb diferentes.
- **Admin tabs sem abstracao CRUD**: Cada tab (`QuestionsTab`, `BpoTab`, `CostsTab`, etc.) reimplementa o mesmo padrao de state management (load/update/add/remove/save/dirty tracking). O `crud-helpers.ts` existe mas so cobre o persist -- o state management e duplicado.

### Recomendacoes

| Prio | Acao |
|------|------|
| P1 | Unificar `formatBRL` em um unico modulo (`lib/format.ts`) e re-exportar de la |
| P1 | Extrair componente `Row` compartilhado para `/components/calc-ui.tsx` |
| P2 | Criar hook `useCrudTable<T>()` generico que encapsule o padrao load/update/add/remove/save/dirty dos admin tabs |
| P2 | Remover `Breadcrumbs` duplicado -- manter um unico componente |
| P2 | Decompor rotas grandes em componentes menores (ex: `DiagnosticScreen1`, `DiagnosticScreen2`, etc.) |

---

## 8. Escalabilidade

### Limites atuais

| Fator | Limite | Risco |
|-------|--------|-------|
| localStorage | ~5MB por dominio | **Medio**: 16 tabelas de config + logs de auditoria. Se muitos diagnosticos forem salvos ou logs acumularem, pode estourar |
| Busca linear | O(n) em toda tabela | **Baixo** para o volume atual (~10-50 registros por tabela) |
| Sem paginacao | Todas as rows carregam de uma vez | **Baixo** agora, mas problematico se tabelas crescerem |
| Single-user | Um navegador = um usuario | **Alto** se a empresa quiser dados centralizados |

### O que quebra se crescer

1. **Multi-usuario**: Impossivel ter visao consolidada de diagnosticos feitos por diferentes consultores em diferentes maquinas.
2. **Auditoria**: Logs de auditoria no localStorage sao triviais de apagar e sem valor legal/compliance.
3. **Dados de pricing**: Se as tabelas de pricing ficarem complexas (centenas de regras), a serializacao/deserializacao JSON a cada operacao vai impactar performance.
4. **Concorrencia**: Se duas abas do admin editam a mesma tabela simultaneamente, a ultima a salvar sobrescreve a primeira sem merge.

### Recomendacoes

| Prio | Acao |
|------|------|
| P0 | Implementar `try/catch` em torno de `localStorage.setItem` para capturar `QuotaExceededError` e mostrar alerta ao usuario |
| P1 | Adicionar funcao de limpeza de logs de auditoria antigos (manter ultimos 30 dias) |
| P2 | Se multi-usuario for necessario no futuro, considerar backend leve (Supabase, Firebase, ou API REST simples) em vez de escalar localStorage |
| P2 | Implementar export completo dos dados para JSON como funcionalidade do admin |

---

## 9. Seguranca

### Analise critica

#### Autenticacao local com SHA-256

**Problemas graves:**

1. **SHA-256 sem salt**: A funcao `hashPassword` em `local-auth.ts` aplica SHA-256 diretamente na senha, sem salt. Duas senhas iguais geram o mesmo hash. Isso e vulneravel a rainbow tables e e considerado INSEGURO para hashing de senhas.

2. **Credenciais no localStorage**: O hash da senha e armazenado em `o2-auth-users` no localStorage, acessivel via DevTools (F12 > Application > Local Storage). Qualquer pessoa com acesso ao navegador pode ver os hashes e a lista de usuarios.

3. **Sessao sem token**: A "sessao" e apenas um JSON salvo no localStorage com o email e role do usuario. Nao ha token assinado nem validacao de integridade. Qualquer usuario pode editar o JSON no DevTools e mudar seu role de `"user"` para `"admin"`.

4. **Auto-registro de admins**: A funcao `signUp` em `local-auth.ts` cria usuarios com `role: "admin"` por padrao. Qualquer pessoa que conhca a URL `/admin/login` pode criar uma conta admin (basta ter email @o2inc.com.br).

5. **Validacao de dominio apenas no frontend**: O filtro `@o2inc.com.br` e trivial de burlar -- e puramente client-side, nao ha validacao de email por confirmacao.

#### Dados expostos

6. **Arquivo .env commitado**: O `.env` na raiz contem chaves do Supabase (SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL). Embora sejam chaves publicas (anon key), elas NAO deveriam estar no repositorio. O `.gitignore` nao inclui `.env`.

7. **Dados financeiros em texto puro**: Faturamento mensal, nome da empresa, diagnostico completo -- tudo em sessionStorage/localStorage sem cifragem. Qualquer extensao do browser ou XSS pode acessar.

#### Avaliacao de risco

| Vulnerabilidade | Severidade | Impacto |
|----------------|-----------|---------|
| SHA-256 sem salt | **Critica** | Hashes reversiveis com rainbow tables |
| Sessao editavel no localStorage | **Alta** | Escalacao de privilegio trivial |
| Auto-registro de admin | **Alta** | Qualquer pessoa cria conta admin |
| .env commitado com chaves | **Media** | Chaves Supabase expostas no repositorio |
| Dados financeiros em plaintext | **Media** | Vazamento de dados sensiveis do cliente |
| Sem validacao de email real | **Media** | Registro com emails falsos |

### Recomendacoes

| Prio | Acao |
|------|------|
| P0 | Adicionar `.env` ao `.gitignore` e remover do historico git (`git filter-branch` ou `BFG Repo-Cleaner`) |
| P0 | Se auth local for mantida: usar `crypto.subtle` com PBKDF2 (100k+ iteracoes) + salt aleatorio em vez de SHA-256 puro |
| P0 | Remover auto-registro de admin ou exigir um "invite code" / seed de primeiro admin |
| P1 | Adicionar integridade na sessao: assinar o JSON da sessao com HMAC ou usar um token com expiracao |
| P1 | Se a plataforma for de uso interno, considerar autenticacao via SSO (Google Workspace com @o2inc.com.br) |
| P2 | Criptografar dados sensiveis no localStorage com chave derivada da senha do usuario |

---

## 10. Boas Praticas React/TypeScript

### Pontos fortes

- **React 19**: Versao mais recente, sem legacy patterns.
- **StrictMode**: Habilitado no `main.tsx`.
- **TypeScript strict**: Usado consistentemente nos hooks e contextos.
- **Interfaces bem definidas**: `DiagnosticQuestion`, `CostParameter`, `BPOPackage`, etc. -- modelagem de dados clara.
- **TanStack Query**: Uso adequado com `staleTime` e loading/error states.
- **ESLint + Prettier**: Configurados e funcionando.

### Pontos fracos

- **Uso extensivo de `any`**: O `QueryBuilder` usa `any` em 12+ lugares. Os admin tabs fazem cast com `as any` frequentemente.
- **Sem testes**: Zero testes automatizados. Nenhum framework de teste configurado (`vitest`, `testing-library`, `playwright`). Para uma aplicacao que calcula precos financeiros, isso e um risco alto.
- **`eslint-disable` e `@ts-nocheck`**: Presentes no `routeTree.gen.ts` (aceitavel, e gerado) mas tambem em comments como `// eslint-disable-next-line react-hooks/exhaustive-deps` que mascaram dependencias faltando em hooks.
- **`console.error` em producao**: O `ErrorComponent` no `__root.tsx` faz `console.error(error)` que expoe stack traces no console de producao.
- **Codigo legado**: `error-capture.ts` contem logica SSR (`globalThis.addEventListener`) que nao faz sentido num SPA puro -- era do TanStack Start.
- **Imports nao utilizados potenciais**: O `react-hook-form` e `zod` estao em dependencies mas nao foram encontrados em nenhum componente (possivelmente legado do Lovable).

### Recomendacoes

| Prio | Acao |
|------|------|
| P0 | Configurar Vitest + Testing Library e escrever testes para `results-logic.ts`, `pricing-shared.ts` e `local-store.ts` (logica de negocio critica) |
| P1 | Remover `error-capture.ts` (legado SSR) |
| P1 | Remover dependencias nao utilizadas (`react-hook-form`, `zod`, `@hookform/resolvers`) -- a menos que estejam planejadas para uso futuro |
| P1 | Substituir `console.error` no ErrorComponent por um servico de error tracking (Sentry, LogRocket) ou simplesmente removar em producao |
| P2 | Reduzir uso de `any` nos admin components -- tipar os dados com as interfaces existentes |

---

## 11. Resumo Executivo de Riscos

### Riscos P0 (Corrigir imediatamente)

1. **Seguranca: `.env` com chaves no repositorio** -- Vazamento de credenciais Supabase
2. **Seguranca: SHA-256 sem salt** -- Hashes de senha vulneraveis
3. **Seguranca: Auto-registro de admin** -- Qualquer pessoa com email @o2inc cria admin
4. **Qualidade: Zero testes** -- Logica de pricing financeiro sem validacao automatizada
5. **Resiliencia: Sem tratamento de `QuotaExceededError`** -- App pode falhar silenciosamente
6. **Dados: Tripla duplicacao de perguntas/regras** -- Inconsistencia entre fontes de verdade

### Riscos P1 (Corrigir em breve)

7. Sessao sem expiracao e sem integridade
8. Cache do React Query nao invalida apos write no admin
9. Protecao de rota feita em componente em vez de `beforeLoad`
10. Facade Supabase desnecessaria adicionando complexidade
11. Duplicacao de funcoes utilitarias (`formatBRL`, `Row`, `Breadcrumbs`)
12. Sem export/import de backup dos dados

### Riscos P2 (Planejar)

13. Migrar de localStorage para IndexedDB
14. Criar layout routes compartilhadas
15. Hook generico `useCrudTable` para admin
16. Decompor componentes de rota grandes

---

## 12. Metricas do Projeto

| Metrica | Valor |
|---------|-------|
| Total de linhas TS/TSX | ~11.094 |
| Rotas | 11 (5 publicas, 5 calculadoras, 2 admin) |
| Componentes UI (shadcn) | ~40 |
| Componentes customizados | ~15 |
| Hooks customizados | 8 |
| Contextos React | 2 (Auth, Diagnostic) |
| Tabelas localStorage | 16 + audit logs |
| Testes automatizados | 0 |
| Dependencias runtime | 35 |
| Dependencias dev | 11 |

---

*Documento gerado por Aria -- System Architect Agent.*
*Revisao baseada em analise estatica do codigo-fonte em 2026-05-15.*
