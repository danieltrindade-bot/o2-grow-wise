export type OptionKey = "green" | "yellow" | "red";

export interface QuestionOption {
  key: OptionKey;
  label: string;
}

export interface Question {
  id: string;
  category: "financial" | "commercial";
  text: string;
  options: QuestionOption[];
}

export const QUESTIONS: Question[] = [
  {
    id: "financial:q1",
    category: "financial",
    text: "Se perguntarmos agora quanto a empresa tem a receber nos próximos 30 dias — conseguem responder com precisão em menos de 5 minutos?",
    options: [
      { key: "green", label: "Sim, temos controle preciso" },
      { key: "yellow", label: "Temos uma ideia geral, mas não consolidado" },
      { key: "red", label: "Não conseguiríamos responder" },
    ],
  },
  {
    id: "financial:q2",
    category: "financial",
    text: "Quando um cliente não paga no vencimento, existe uma régua de cobrança definida com responsável e canal?",
    options: [
      { key: "green", label: "Sim, temos isso estruturado" },
      { key: "yellow", label: "Fazemos algo, mas é informal" },
      { key: "red", label: "Não temos / Não sei" },
    ],
  },
  {
    id: "financial:q3",
    category: "financial",
    text: "Existe um processo formal de aprovação para compras, com alçadas e registro — com prazo, antes do pagamento?",
    options: [
      { key: "green", label: "Sim, temos fluxo de aprovação" },
      { key: "yellow", label: "Aprovação informal ou parcial" },
      { key: "red", label: "Não temos processo definido" },
    ],
  },
  {
    id: "financial:q4",
    category: "financial",
    text: "Pagamentos em atraso, multas ou juros com fornecedores acontecem com frequência?",
    options: [
      { key: "green", label: "Raramente ou nunca acontece" },
      { key: "yellow", label: "Acontece às vezes" },
      { key: "red", label: "Sim, é comum" },
    ],
  },
  {
    id: "financial:q5",
    category: "financial",
    text: "A empresa faz conciliação bancária com frequência — semanal ou mais?",
    options: [
      { key: "green", label: "Sim, semanalmente ou mais" },
      { key: "yellow", label: "Mensalmente" },
      { key: "red", label: "Pelo contador ou não fazemos" },
    ],
  },
  {
    id: "commercial:q1",
    category: "commercial",
    text: "A empresa sabe quais clientes ou produtos são mais lucrativos — não só os que mais faturam, mas os que mais geram margem?",
    options: [
      { key: "green", label: "Sim, temos essa visibilidade" },
      { key: "yellow", label: "Sabemos parcialmente" },
      { key: "red", label: "Não medimos / não sabemos" },
    ],
  },
  {
    id: "commercial:q2",
    category: "commercial",
    text: "Quando o time de vendas dá desconto, existe um limite definido com critério claro de aprovação?",
    options: [
      { key: "green", label: "Sim, temos política de desconto" },
      { key: "yellow", label: "Existe algo informal" },
      { key: "red", label: "Desconto é decidido na hora" },
    ],
  },
  {
    id: "commercial:q3",
    category: "commercial",
    text: "As condições de pagamento são definidas pela empresa ou pelo cliente na hora de fechar o negócio?",
    options: [
      { key: "green", label: "A empresa define as condições" },
      { key: "yellow", label: "Negociamos caso a caso" },
      { key: "red", label: "O cliente acaba definindo" },
    ],
  },
  {
    id: "commercial:q4",
    category: "commercial",
    text: "Conseguem projetar quanto vai entrar no caixa nos próximos 60 dias com base no pipeline de vendas?",
    options: [
      { key: "green", label: "Sim, temos forecast integrado" },
      { key: "yellow", label: "Estimamos de forma aproximada" },
      { key: "red", label: "Não conseguimos projetar" },
    ],
  },
  {
    id: "commercial:q5",
    category: "commercial",
    text: "Já aconteceu de vender muito em um mês e não ter caixa suficiente no mês seguinte?",
    options: [
      { key: "green", label: "Nunca aconteceu" },
      { key: "yellow", label: "Aconteceu raramente" },
      { key: "red", label: "Sim, é recorrente" },
    ],
  },
];

export const SCORE_MAP: Record<OptionKey, number> = {
  green: 0,
  yellow: 1,
  red: 2,
};
