# Perguntas direcionadas por setor

Draft de conteúdo para revisão. Fonte no código: `src/lib/sector-questions.ts`.

**Como funciona:** das 10 perguntas do diagnóstico, **5 são reescritas por setor** (as outras 5 permanecem genéricas). O ID e a semântica 🟢🟡🔴 são sempre os mesmos — só o texto muda — por isso score, cálculo de perda e recomendação de produto continuam funcionando.

As 5 perguntas direcionadas são:

| ID | Tema |
|---|---|
| `financial:q1` | Previsão de recebíveis (D+90) |
| `financial:q2` | Régua de cobrança |
| `commercial:q1` | Margem / lucratividade real |
| `commercial:q3` | Quem define as condições de pagamento |
| `commercial:q5` | Descasamento vendas × caixa |

Legenda das opções: 🟢 verde (saudável) · 🟡 amarelo (parcial) · 🔴 vermelho (crítico).
Na tela de resultados, cada pergunta com 🟡/🔴 vira um **ponto de atenção** e, quando há perda estimada, um **label de perda** (mostrados abaixo de cada pergunta).

---

## 🏭 Indústria

### 1. `financial:q1` — Previsão de recebíveis
**Você tem previsão de D+90, no mínimo, do recebível dos seus pedidos de produção e contratos faturados?**
- 🟢 Sim, acompanhamos por pedido/contrato
- 🟡 Temos uma ideia, mas não consolidado
- 🔴 Não conseguiríamos responder

*Atenção:* Recebível de pedidos sem previsão · *Perda:* Perda por atraso no recebível de pedidos faturados (🔴) / Recebível de pedidos parcialmente monitorado (🟡)

### 2. `financial:q2` — Régua de cobrança
**Quando um cliente industrial atrasa o pagamento de um pedido faturado, existe régua de cobrança com responsável e canal definidos?**
- 🟢 Sim, estruturada por cliente
- 🟡 Fazemos algo, mas é informal
- 🔴 Não temos / Não sei

*Atenção:* Cobrança de pedidos sem régua · *Perda:* Inadimplência de clientes industriais sem controle (🔴) / Inadimplência de pedidos parcialmente controlada (🟡)

### 3. `commercial:q1` — Margem real
**A empresa sabe quais linhas de produto e clientes geram mais margem — descontando matéria-prima, produção e logística?**
- 🟢 Sim, margem por SKU/linha
- 🟡 Sabemos parcialmente
- 🔴 Não medimos a margem real

*Atenção:* Margem por linha não medida · *Perda:* Linhas/SKUs sem margem priorizada (🔴, qualitativo)

### 4. `commercial:q3` — Condições de pagamento
**Os prazos de pagamento são definidos pela sua empresa ou ditados pelas grandes contas no fechamento do pedido?**
- 🟢 A empresa define os prazos
- 🟡 Negociamos caso a caso
- 🔴 A grande conta dita o prazo

*Atenção:* Grande conta dita o prazo · *Perda:* Capital de giro imobilizado em prazos de grandes contas (🔴)

### 5. `commercial:q5` — Vendas × caixa
**Já aconteceu de fechar um grande volume de pedidos e faltar caixa para comprar insumo e produzir?**
- 🟢 Nunca aconteceu
- 🟡 Aconteceu raramente
- 🔴 Sim, é recorrente

*Atenção:* Produção sem lastro de caixa · *Perda:* Crédito emergencial para bancar produção (🔴) / Risco de descasamento pedidos × caixa (🟡)

---

## 🛒 Comércio

### 1. `financial:q1` — Previsão de recebíveis
**Você tem previsão de D+90, no mínimo, do seu recebível — vendas no cartão, crediário e prazos com fornecedores?**
- 🟢 Sim, controle por canal de venda
- 🟡 Temos uma ideia, mas não consolidado
- 🔴 Não conseguiríamos responder

*Atenção:* Recebível de vendas sem previsão · *Perda:* Perda por recebíveis de venda não monitorados (🔴) / Recebível de vendas parcialmente monitorado (🟡)

### 2. `financial:q2` — Régua de cobrança
**Quando uma venda a prazo (crediário/fiado) não é paga, existe régua de cobrança definida com responsável e canal?**
- 🟢 Sim, temos isso estruturado
- 🟡 Fazemos algo, mas é informal
- 🔴 Não temos / Não sei

*Atenção:* Crediário sem régua de cobrança · *Perda:* Inadimplência de crediário sem controle (🔴) / Inadimplência de crediário parcialmente controlada (🟡)

### 3. `commercial:q1` — Margem real
**A empresa sabe quais produtos geram mais lucro por unidade — não só os que mais vendem, mas os que dão mais margem com o giro?**
- 🟢 Sim, margem por produto/categoria
- 🟡 Sabemos parcialmente
- 🔴 Não cruzamos giro com margem

*Atenção:* Giro × margem não medido · *Perda:* Produtos sem priorização por margem (🔴, qualitativo)

### 4. `commercial:q3` — Condições de pagamento
**O prazo das maquininhas e dos fornecedores trabalha a favor do seu caixa, ou você recebe depois e paga antes?**
- 🟢 Prazos alinhados a favor do caixa
- 🟡 Equilibrado, mas sem gestão ativa
- 🔴 Pago antes de receber

*Atenção:* Recebe depois, paga antes · *Perda:* Capital de giro imobilizado no descasamento de prazos (🔴)

### 5. `commercial:q5` — Vendas × caixa
**Já aconteceu de vender muito numa data sazonal (Natal, Black Friday) e apertar o caixa no mês seguinte?**
- 🟢 Nunca aconteceu
- 🟡 Aconteceu raramente
- 🔴 Sim, a cada pico de venda

*Atenção:* Sazonalidade aperta o caixa · *Perda:* Crédito emergencial pós-pico de venda (🔴) / Risco de descasamento venda × caixa na sazonalidade (🟡)

---

## 🛠️ Serviço

### 1. `financial:q1` — Previsão de recebíveis
**Você tem previsão de D+90, no mínimo, do recebível dos seus contratos recorrentes e projetos em andamento?**
- 🟢 Sim, por contrato/projeto
- 🟡 Temos uma ideia, mas não consolidado
- 🔴 Não conseguiríamos responder

*Atenção:* Recebível de contratos sem previsão · *Perda:* Perda por recebíveis de contratos não monitorados (🔴) / Recebível de contratos parcialmente monitorado (🟡)

### 2. `financial:q2` — Régua de cobrança
**Quando um cliente de contrato recorrente atrasa a mensalidade, existe régua de cobrança com responsável e canal definidos?**
- 🟢 Sim, temos isso estruturado
- 🟡 Fazemos algo, mas é informal
- 🔴 Não temos / Não sei

*Atenção:* Mensalidade sem régua de cobrança · *Perda:* Inadimplência de mensalidades sem controle (🔴) / Inadimplência de mensalidades parcialmente controlada (🟡)

### 3. `commercial:q1` — Margem real
**A empresa sabe quais contratos e clientes dão mais margem — descontando as horas e o custo da equipe alocada?**
- 🟢 Sim, margem por contrato/hora
- 🟡 Sabemos parcialmente
- 🔴 Não medimos custo por hora/projeto

*Atenção:* Custo por hora/projeto não medido · *Perda:* Contratos sem margem por hora priorizada (🔴, qualitativo)

### 4. `commercial:q3` — Condições de pagamento
**As condições e reajustes dos contratos são definidos pela sua empresa ou o cliente impõe prazo e preço?**
- 🟢 A empresa define as condições
- 🟡 Negociamos caso a caso
- 🔴 O cliente impõe as condições

*Atenção:* Cliente impõe as condições · *Perda:* Capital de giro imobilizado em prazos longos de contrato (🔴)

### 5. `commercial:q5` — Vendas × caixa
**Já aconteceu de fechar vários projetos/contratos ao mesmo tempo e faltar caixa para bancar a equipe alocada?**
- 🟢 Nunca aconteceu
- 🟡 Aconteceu raramente
- 🔴 Sim, é recorrente

*Atenção:* Equipe sem lastro de caixa · *Perda:* Crédito emergencial para bancar equipe alocada (🔴) / Risco de descasamento projetos × caixa (🟡)

---

## 🚀 Startup

### 1. `financial:q1` — Previsão de recebíveis
**Você tem visibilidade de D+90 do seu caixa — MRR a receber, runway e queima projetada?**
- 🟢 Sim, runway e MRR controlados
- 🟡 Temos uma ideia, mas não consolidado
- 🔴 Não conseguiríamos responder

*Atenção:* Runway sem visibilidade · *Perda:* Perda por MRR a receber não monitorado (🔴) / MRR a receber parcialmente monitorado (🟡)

### 2. `financial:q2` — Régua de cobrança
**Quando um cliente de assinatura deixa de pagar, existe régua de cobrança e tratamento do churn financeiro?**
- 🟢 Sim, temos isso estruturado
- 🟡 Fazemos algo, mas é informal
- 🔴 Não temos / Não sei

*Atenção:* Churn financeiro sem régua · *Perda:* Inadimplência de assinaturas sem controle (🔴) / Inadimplência de assinaturas parcialmente controlada (🟡)

### 3. `commercial:q1` — Margem real
**A empresa sabe quais clientes/planos têm melhor unit economics — LTV × CAC, não só o que mais fatura?**
- 🟢 Sim, acompanhamos unit economics
- 🟡 Sabemos parcialmente
- 🔴 Não medimos LTV/CAC

*Atenção:* Unit economics não medido · *Perda:* Planos sem priorização por LTV/CAC (🔴, qualitativo)

### 4. `commercial:q3` — Condições de pagamento
**Os termos de pagamento (anual antecipado × mensal) são definidos por você ou pelo cliente na negociação?**
- 🟢 A empresa define os termos
- 🟡 Negociamos caso a caso
- 🔴 O cliente define os termos

*Atenção:* Cliente define os termos · *Perda:* Capital de giro imobilizado em recebimento mensal (🔴)

### 5. `commercial:q5` — Vendas × caixa
**Já aconteceu de crescer rápido em vendas e a queima de caixa ameaçar o runway no mês seguinte?**
- 🟢 Nunca aconteceu
- 🟡 Aconteceu raramente
- 🔴 Sim, é recorrente

*Atenção:* Crescimento queima o runway · *Perda:* Crédito emergencial para sustentar a queima (🔴) / Risco de descasamento crescimento × runway (🟡)

---

## 🏛️ Governo

> Interpretado como **empresa que vende para o governo** (empenho, licitação, repasse). Se o público-alvo for órgão público interno, o enfoque muda — avisar.

### 1. `financial:q1` — Previsão de recebíveis
**Você tem previsão de D+90, no mínimo, dos seus recebíveis — empenhos, notas empenhadas e repasses dos órgãos?**
- 🟢 Sim, por empenho/contrato
- 🟡 Temos uma ideia, mas não consolidado
- 🔴 Não conseguiríamos responder

*Atenção:* Empenhos sem previsão de recebimento · *Perda:* Perda por empenhos/repasses não monitorados (🔴) / Empenhos parcialmente monitorados (🟡)

### 2. `financial:q2` — Régua de cobrança
**Quando um órgão atrasa o pagamento de uma nota empenhada, existe processo definido de acompanhamento e cobrança?**
- 🟢 Sim, temos isso estruturado
- 🟡 Fazemos algo, mas é informal
- 🔴 Não temos / Não sei

*Atenção:* Nota empenhada sem acompanhamento · *Perda:* Atraso de repasse sem processo de cobrança (🔴) / Acompanhamento de repasse parcial (🟡)

### 3. `commercial:q1` — Margem real
**A empresa sabe quais contratos e licitações dão mais margem real — descontando custo de execução e prazo de recebimento?**
- 🟢 Sim, margem por contrato/edital
- 🟡 Sabemos parcialmente
- 🔴 Não medimos a margem real

*Atenção:* Margem por contrato não medida · *Perda:* Contratos/editais sem margem real priorizada (🔴, qualitativo)

### 4. `commercial:q3` — Condições de pagamento
**Você precifica o custo do prazo de recebimento ao participar de um edital, ou aceita o prazo do órgão sem projetar o impacto no caixa?**
- 🟢 Precificamos o custo do prazo
- 🟡 Às vezes consideramos
- 🔴 Aceitamos o prazo sem projetar

*Atenção:* Prazo do edital não precificado · *Perda:* Capital de giro imobilizado no prazo do edital (🔴)

### 5. `commercial:q5` — Vendas × caixa
**Já aconteceu de ganhar várias licitações e faltar capital de giro para executar enquanto o repasse não chega?**
- 🟢 Nunca aconteceu
- 🟡 Aconteceu raramente
- 🔴 Sim, é recorrente

*Atenção:* Execução sem capital de giro · *Perda:* Crédito emergencial para executar antes do repasse (🔴) / Risco de descasamento execução × repasse (🟡)

---

## As 5 perguntas que permanecem genéricas

Não mudam por setor (mesmo texto para todos):

- `financial:q3` — Processo formal de aprovação de compras
- `financial:q4` — Pagamentos em atraso / multas / juros com fornecedores
- `financial:q5` — Conciliação bancária diária
- `commercial:q2` — Política de desconto com limite e aprovação
- `commercial:q4` — Antecipação de recebíveis

> Se quiser direcionar alguma destas também, é só adicionar o override em `src/lib/sector-questions.ts` — a infra já suporta.
