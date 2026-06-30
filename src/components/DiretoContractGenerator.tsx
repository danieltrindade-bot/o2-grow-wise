import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FileText,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  PenLine,
  CreditCard,
  Send,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const API_BASE =
  import.meta.env.VITE_CONTRACT_API_URL || "http://localhost:8000";

// ── Service metadata ──

type ServiceKey =
  | "diagnostico"
  | "assessoria"
  | "valuation"
  | "cfo"
  | "coordenador"
  | "bpo"
  | "oxy"
  | "turnaround";

type Aviso = "30" | "60" | "90" | "na";

interface ServiceMeta {
  key: ServiceKey;
  label: string;
  recorrente: boolean;
  setup: boolean;
  pontual: boolean;
  nucleo: boolean;
  defaultAviso: Aviso;
}

const SERVICES: ServiceMeta[] = [
  {
    key: "diagnostico",
    label: "Diagnóstico Estratégico",
    recorrente: false,
    setup: false,
    pontual: true,
    nucleo: false,
    defaultAviso: "na",
  },
  {
    key: "assessoria",
    label: "Assessoria Financeira",
    recorrente: true,
    setup: true,
    pontual: false,
    nucleo: true,
    defaultAviso: "90",
  },
  {
    key: "valuation",
    label: "Valuation",
    recorrente: false,
    setup: false,
    pontual: true,
    nucleo: false,
    defaultAviso: "na",
  },
  {
    key: "cfo",
    label: "CFO as a Service",
    recorrente: true,
    setup: true,
    pontual: false,
    nucleo: true,
    defaultAviso: "60",
  },
  {
    key: "coordenador",
    label: "Coordenador Financeiro",
    recorrente: true,
    setup: true,
    pontual: false,
    nucleo: false,
    defaultAviso: "60",
  },
  {
    key: "bpo",
    label: "BPO Financeiro",
    recorrente: true,
    setup: true,
    pontual: false,
    nucleo: false,
    defaultAviso: "30",
  },
  {
    key: "oxy",
    label: "Oxy + Gênio",
    recorrente: true,
    setup: true,
    pontual: false,
    nucleo: false,
    defaultAviso: "30",
  },
  {
    key: "turnaround",
    label: "Turnaround",
    recorrente: false,
    setup: false,
    pontual: false,
    nucleo: false,
    defaultAviso: "30",
  },
];

const SERVICE_ORDER: ServiceKey[] = SERVICES.map((s) => s.key);
const META = Object.fromEntries(SERVICES.map((s) => [s.key, s])) as Record<
  ServiceKey,
  ServiceMeta
>;

// ── Types ──

type FormaPagamento =
  | "cartao"
  | "boleto"
  | "pix"
  | "cartao_boleto"
  | "pix_boleto"
  | "custom";

type LinhaForma = "pix" | "boleto" | "cartao";

interface PagamentoLinha {
  forma: LinhaForma;
  valor: string;
  parcelas: string;
  data: string | null;
}

interface CustomLine {
  forma: LinhaForma;
  valor: string;
  parcelas: string;
  data: string;
}

type ActionStatus = {
  type: "idle" | "loading" | "success" | "error";
  message?: string;
};

interface Signature {
  name: string;
  email: string;
  link?: { short_link: string };
}

interface GenerateAndDriveResponse {
  message: string;
  pasta: string;
  docx_link: string;
  pdf_link: string | null;
}

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

interface CepData {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  cep: string;
}

export interface DiretoContractGeneratorProps {
  defaultServico?: ServiceKey;
  clientName?: string;
  valorSetupReais?: number;
  valorMensalReais?: number;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

// ── Helpers ──

function formatCNPJ(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12)
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/** Parse a money string typed as "12000" or "12.000,00" into a number (reais). */
function parseMoney(v: string): number {
  const s = v.trim();
  if (!s) return 0;
  if (s.includes(",")) {
    // "12.000,00" → remove thousand dots, comma → dot
    const cleaned = s.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "");
    return parseFloat(cleaned) || 0;
  }
  // "12000" or "12000.50"
  const cleaned = s.replace(/[^\d.]/g, "");
  return parseFloat(cleaned) || 0;
}

function formatBRLNumber(n: number): string {
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function useCepLookup() {
  const cache = useRef<Map<string, CepData>>(new Map());
  return useCallback(async (cep: string): Promise<CepData | null> => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return null;
    if (cache.current.has(digits)) return cache.current.get(digits)!;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      if (!r.ok) return null;
      const data = await r.json();
      if (data.erro) return null;
      cache.current.set(digits, data);
      return data;
    } catch {
      return null;
    }
  }, []);
}

// ── Component ──

export function DiretoContractGenerator(props: DiretoContractGeneratorProps) {
  const {
    defaultServico = "cfo",
    clientName = "",
    valorSetupReais,
    valorMensalReais,
    expanded: controlledExpanded,
    onExpandedChange,
  } = props;

  const controlled = onExpandedChange !== undefined;
  const [internalExpanded, setInternalExpanded] = useState(false);
  const expanded = controlled ? (controlledExpanded ?? false) : internalExpanded;
  const setExpanded = controlled ? onExpandedChange! : setInternalExpanded;

  // ── Service selection ──
  const [selected, setSelected] = useState<Set<ServiceKey>>(
    () => new Set<ServiceKey>([defaultServico]),
  );

  function toggleService(key: ServiceKey) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // ── Formato / referência ──
  const [formato, setFormato] = useState<"completo" | "order">("completo");
  const [refNum, setRefNum] = useState("0000");
  const [rascunho, setRascunho] = useState(false);
  const [masterNum, setMasterNum] = useState("001");
  const [masterData, setMasterData] = useState("29/06/2026");
  const [masterLink, setMasterLink] = useState("");

  // ── Per-service values ──
  const [turnFixo, setTurnFixo] = useState("");
  const [turnPct, setTurnPct] = useState("3");
  const [valorSetup, setValorSetup] = useState(
    valorSetupReais != null ? String(valorSetupReais) : "",
  );
  const [mrr, setMrr] = useState<Record<string, string>>(() =>
    valorMensalReais != null ? { cfo: String(valorMensalReais) } : {},
  );
  const [valorPontual, setValorPontual] = useState<Record<string, string>>({});
  const [bpoLancamentos, setBpoLancamentos] = useState("6");
  const [bpoContas, setBpoContas] = useState("2");

  // ── Pagamento ──
  const [formaPgto, setFormaPgto] = useState<FormaPagamento>("cartao");
  const [cartaoParcelas, setCartaoParcelas] = useState("12");
  const [boletoParcelas, setBoletoParcelas] = useState("1");
  const [boletoData, setBoletoData] = useState("");
  // cartao_boleto / pix_boleto composição
  const [compVb, setCompVb] = useState("");
  const [compQb, setCompQb] = useState("1");
  const [compNc, setCompNc] = useState("12");
  const [compDt, setCompDt] = useState("");
  // custom
  const [customCount, setCustomCount] = useState(1);
  const [customLines, setCustomLines] = useState<CustomLine[]>([
    { forma: "pix", valor: "", parcelas: "1", data: "" },
  ]);

  // ── Aviso prévio ──
  const [avisos, setAvisos] = useState<Record<string, Aviso>>({});

  // ── Condições gerais ──
  const [vigencia, setVigencia] = useState("12");
  const [foro, setForo] = useState("Comarca de São Paulo/SP");
  const [dataContrato, setDataContrato] = useState("");

  // ── Empresa ──
  const [nomeCliente, setNomeCliente] = useState(clientName);
  const [cnpj, setCnpj] = useState("");
  const [cep, setCep] = useState("");
  const [cepData, setCepData] = useState<CepData | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");

  // ── API / status ──
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [makeStatus, setMakeStatus] = useState<ActionStatus>({ type: "idle" });
  const [driveResult, setDriveResult] = useState<GenerateAndDriveResponse | null>(
    null,
  );

  // ── Autentique ──
  const [showAutentique, setShowAutentique] = useState(false);
  const [emailContratante, setEmailContratante] = useState("");
  const [autSandbox, setAutSandbox] = useState(false);
  const [autStatus, setAutStatus] = useState<ActionStatus>({ type: "idle" });
  const [signingLink, setSigningLink] = useState("");
  const [signatures, setSignatures] = useState<Signature[]>([]);

  // ── iPag ──
  const [showIpag, setShowIpag] = useState(false);
  const [ipagValor, setIpagValor] = useState("");
  const [ipagParcelas, setIpagParcelas] = useState(12);
  const [ipagSemJuros, setIpagSemJuros] = useState(3);
  const [ipagSandbox, setIpagSandbox] = useState(false);
  const [ipagDescricao, setIpagDescricao] = useState("");
  const [ipagStatus, setIpagStatus] = useState<ActionStatus>({ type: "idle" });
  const [paymentLink, setPaymentLink] = useState("");

  // ── Drive / Slack ──
  const [driveStatus, setDriveStatus] = useState<ActionStatus>({ type: "idle" });
  const [driveLink, setDriveLink] = useState("");
  const [slackStatus, setSlackStatus] = useState<ActionStatus>({ type: "idle" });

  const cepLookup = useCepLookup();
  const cepTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (clientName) setNomeCliente(clientName);
  }, [clientName]);

  useEffect(() => {
    if (valorSetupReais != null) setValorSetup(String(valorSetupReais));
  }, [valorSetupReais]);

  useEffect(() => {
    if (valorMensalReais != null)
      setMrr((prev) => ({ ...prev, cfo: String(valorMensalReais) }));
  }, [valorMensalReais]);

  useEffect(() => {
    if (!expanded) return;
    fetch(`${API_BASE}/api/health`)
      .then((r) => setApiOk(r.ok))
      .catch(() => setApiOk(false));
  }, [expanded]);

  // Prefill iPag description with client name
  useEffect(() => {
    setIpagDescricao(`${nomeCliente.trim() || "Cliente"} - Contrato Direto`);
  }, [nomeCliente]);

  useEffect(() => {
    clearTimeout(cepTimer.current);
    if (cep.length === 8) {
      setCepLoading(true);
      cepTimer.current = setTimeout(async () => {
        const data = await cepLookup(cep);
        setCepData(data);
        setCepLoading(false);
      }, 400);
    } else {
      setCepData(null);
      setCepLoading(false);
    }
  }, [cep, cepLookup]);

  // ── Derived ──
  const selectedKeys = useMemo(
    () => SERVICE_ORDER.filter((k) => selected.has(k)),
    [selected],
  );

  const recurring = useMemo(
    () => selectedKeys.filter((k) => META[k].recorrente && k !== "oxy"),
    [selectedKeys],
  );
  const pontuais = useMemo(
    () => selectedKeys.filter((k) => META[k].pontual),
    [selectedKeys],
  );
  const oxyProjeto = useMemo(
    () =>
      selected.has("oxy") &&
      !(["assessoria", "cfo", "coordenador", "bpo"] as ServiceKey[]).some((k) =>
        selected.has(k),
      ),
    [selected],
  );
  const hasSetup = useMemo(
    () => selectedKeys.some((k) => META[k].setup),
    [selectedKeys],
  );

  const enderecoEmpresa = cepData
    ? [
        cepData.logradouro,
        numero ? `, ${numero}` : "",
        complemento ? `, ${complemento}` : "",
        cepData.bairro ? `, ${cepData.bairro}` : "",
        `, ${cepData.localidade} - ${cepData.uf}`,
        `, CEP ${cepData.cep}`,
      ].join("")
    : "";

  // ── MRR total ──
  const mrrTotalNum = useMemo(
    () => recurring.reduce((s, k) => s + parseMoney(mrr[k] || ""), 0),
    [recurring, mrr],
  );

  // ── Validation ──
  const validationErrors = useMemo(() => {
    const errs: string[] = [];
    if (selectedKeys.length === 0) errs.push("Selecione ao menos um serviço.");
    const nucleoCount = selectedKeys.filter((k) => META[k].nucleo).length;
    if (nucleoCount > 1)
      errs.push(
        "Assessoria Financeira e CFO as a Service são mutuamente exclusivos (máximo 1 núcleo).",
      );
    if (selected.has("assessoria") && selected.has("diagnostico"))
      errs.push(
        "Assessoria Financeira e Diagnóstico avulso são mutuamente exclusivos.",
      );
    return errs;
  }, [selectedKeys, selected]);

  // ── Pagamento base ──
  const pagamentoBaseNum = useMemo(() => {
    if (parseMoney(valorSetup)) return parseMoney(valorSetup);
    const pontualSum = pontuais.reduce(
      (s, k) => s + parseMoney(valorPontual[k] || ""),
      0,
    );
    if (pontualSum) return pontualSum;
    if (parseMoney(turnFixo)) return parseMoney(turnFixo);
    return 0;
  }, [valorSetup, pontuais, valorPontual, turnFixo]);

  const baseStr = String(pagamentoBaseNum || 0);
  const showPagamento = !selected.has("turnaround");

  // ── Build pagamento_linhas ──
  const pagamentoLinhas = useMemo<PagamentoLinha[]>(() => {
    if (!showPagamento) return [];
    const base = pagamentoBaseNum;
    switch (formaPgto) {
      case "cartao":
        return [{ forma: "cartao", valor: baseStr, parcelas: cartaoParcelas, data: null }];
      case "boleto":
        return [
          { forma: "boleto", valor: baseStr, parcelas: boletoParcelas, data: boletoData || null },
        ];
      case "pix":
        return [{ forma: "pix", valor: baseStr, parcelas: "1", data: null }];
      case "cartao_boleto": {
        const vb = parseMoney(compVb);
        const resto = base - vb;
        return [
          { forma: "cartao", valor: String(resto), parcelas: compNc, data: null },
          { forma: "boleto", valor: String(vb), parcelas: compQb, data: null },
        ];
      }
      case "pix_boleto": {
        const vb = parseMoney(compVb);
        const resto = base - vb;
        return [
          { forma: "pix", valor: String(resto), parcelas: "1", data: null },
          { forma: "boleto", valor: String(vb), parcelas: compQb, data: compDt || null },
        ];
      }
      case "custom":
        return customLines.slice(0, customCount).map((l) => ({
          forma: l.forma,
          valor: l.valor,
          parcelas: l.parcelas,
          data: l.forma === "boleto" ? l.data || null : null,
        }));
      default:
        return [];
    }
  }, [
    showPagamento,
    formaPgto,
    pagamentoBaseNum,
    baseStr,
    cartaoParcelas,
    boletoParcelas,
    boletoData,
    compVb,
    compQb,
    compNc,
    compDt,
    customLines,
    customCount,
  ]);

  const pagamentoSomaNum = useMemo(
    () => pagamentoLinhas.reduce((s, l) => s + parseMoney(l.valor), 0),
    [pagamentoLinhas],
  );
  const pagamentoBalance =
    Math.abs(pagamentoSomaNum - pagamentoBaseNum) < 0.01
      ? "ok"
      : pagamentoSomaNum > pagamentoBaseNum
        ? "excedem"
        : "aquem";

  // ── Aviso resolved ──
  function avisoFor(k: ServiceKey): Aviso {
    return avisos[k] ?? META[k].defaultAviso;
  }

  const isValid =
    validationErrors.length === 0 &&
    nomeCliente.trim().length > 0 &&
    apiOk !== false;

  // ── Build payload ──
  function buildPayload(): Record<string, unknown> {
    const mrrBreakdown: Array<[string, string]> = recurring.map((k) => [
      META[k].label,
      mrr[k] || "",
    ]);
    const valorPontualObj: Record<string, string> = {};
    for (const k of pontuais) valorPontualObj[k] = valorPontual[k] || "";
    const avisoObj: Record<string, Aviso> = {};
    for (const k of selectedKeys) avisoObj[k] = avisoFor(k);

    const dataFmt = dataContrato || "";

    return {
      modelo: "Contrato Direto (modular)",
      nome_cliente: nomeCliente.trim(),
      cnpj,
      endereco_empresa: enderecoEmpresa,
      servicos: selectedKeys,
      formato,
      ref_num: refNum || "0000",
      ref_status: rascunho ? "RASCUNHO" : "",
      master_num: masterNum || "001",
      master_data: masterData || "29/06/2026",
      master_link: formato === "order" ? masterLink : "",
      vigencia_meses: Number(vigencia) || 12,
      foro: foro || "Comarca de São Paulo/SP",
      valor_setup: hasSetup ? valorSetup : "",
      mrr_total: mrrTotalNum ? String(mrrTotalNum) : "",
      mrr_breakdown: mrrBreakdown,
      valor_pontual: valorPontualObj,
      turn_fixo: selected.has("turnaround") ? turnFixo : "",
      turn_pct: turnPct || "3",
      bpo_lancamentos: bpoLancamentos || "6",
      bpo_contas: bpoContas || "2",
      oxy_projeto: oxyProjeto,
      aviso_por_servico: avisoObj,
      pagamento_linhas: pagamentoLinhas,
      pagamento_base: baseStr,
      data_contrato: dataFmt,
    };
  }

  // Generate a contract file via the given endpoint and return its bytes
  // (base64) + filename. Mirrors the base64 conversion of ContractGenerator.
  async function generateBytes(
    endpoint: string,
    fallback: string,
  ): Promise<{ b64: string; filename: string; blob: Blob }> {
    const r = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload()),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({ detail: "Erro desconhecido" }));
      throw new Error(err.detail || `HTTP ${r.status}`);
    }
    const blob = await r.blob();
    const disposition = r.headers.get("content-disposition") || "";
    const match = disposition.match(/filename="(.+?)"/);
    const filename = match?.[1] || fallback;

    const arrayBuf = await blob.arrayBuffer();
    const b64 = btoa(
      new Uint8Array(arrayBuf).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        "",
      ),
    );
    return { b64, filename, blob };
  }

  async function handleGenerateAndDrive() {
    setMakeStatus({ type: "loading" });
    setDriveResult(null);
    try {
      const r = await fetch(`${API_BASE}/api/contracts/generate-and-drive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({ detail: "Erro desconhecido" }));
        throw new Error(err.detail || `HTTP ${r.status}`);
      }
      const data: GenerateAndDriveResponse = await r.json();
      setDriveResult(data);
      setMakeStatus({
        type: "success",
        message: data.message || "Contrato gerado e salvo no Drive!",
      });
    } catch (e) {
      setMakeStatus({
        type: "error",
        message: e instanceof Error ? e.message : "Erro ao fazer o contrato",
      });
    }
  }

  async function handleAutentique() {
    if (!emailContratante.trim()) return;
    setAutStatus({ type: "loading" });
    setSigningLink("");
    setSignatures([]);
    try {
      // Prefer PDF; fall back to DOCX.
      let bytes: { b64: string; filename: string };
      try {
        const pdf = await generateBytes(
          "/api/contracts/generate-pdf",
          "contrato.pdf",
        );
        bytes = { b64: pdf.b64, filename: pdf.filename };
      } catch {
        const docx = await generateBytes(
          "/api/contracts/generate",
          "contrato.docx",
        );
        bytes = { b64: docx.b64, filename: docx.filename };
      }
      const r = await fetch(`${API_BASE}/api/contracts/autentique`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_bytes_b64: bytes.b64,
          filename: bytes.filename,
          doc_name: `Contrato Direto - ${nomeCliente.trim()} & O2 Inc`,
          email_contratante: emailContratante.trim(),
          nome_contratante: nomeCliente.trim(),
          sandbox: autSandbox,
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({ detail: "Erro" }));
        throw new Error(err.detail || `HTTP ${r.status}`);
      }
      const data = await r.json();
      setSigningLink(data.client_signing_link || "");
      setSignatures(Array.isArray(data.signatures) ? data.signatures : []);
      setAutStatus({
        type: "success",
        message: data.message || "Enviado para assinatura!",
      });
    } catch (e) {
      setAutStatus({
        type: "error",
        message: e instanceof Error ? e.message : "Erro ao enviar",
      });
    }
  }

  async function handleIpag() {
    setIpagStatus({ type: "loading" });
    setPaymentLink("");
    try {
      const valor = parseMoney(ipagValor);
      const r = await fetch(`${API_BASE}/api/contracts/ipag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          valor,
          descricao: ipagDescricao.trim(),
          max_parcelas: ipagParcelas,
          parcelas_sem_juros: ipagSemJuros,
          sandbox: ipagSandbox,
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({ detail: "Erro" }));
        throw new Error(err.detail || `HTTP ${r.status}`);
      }
      const data = await r.json();
      setPaymentLink(data.payment_link || "");
      setIpagStatus({
        type: "success",
        message: data.message || "Link de pagamento gerado!",
      });
    } catch (e) {
      setIpagStatus({
        type: "error",
        message: e instanceof Error ? e.message : "Erro ao gerar link",
      });
    }
  }

  async function handleDrive() {
    setDriveStatus({ type: "loading" });
    setDriveLink("");
    try {
      const { b64, filename } = await generateBytes(
        "/api/contracts/generate",
        "contrato.docx",
      );
      const r = await fetch(`${API_BASE}/api/contracts/drive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_bytes_b64: b64,
          filename,
          mimetype: DOCX_MIME,
          company_name: nomeCliente.trim(),
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({ detail: "Erro" }));
        throw new Error(err.detail || `HTTP ${r.status}`);
      }
      const data = await r.json();
      setDriveLink(data.link || "");
      setDriveStatus({
        type: "success",
        message: data.message || "Enviado para o Drive!",
      });
    } catch (e) {
      setDriveStatus({
        type: "error",
        message: e instanceof Error ? e.message : "Erro ao enviar para o Drive",
      });
    }
  }

  async function handleSlack() {
    setSlackStatus({ type: "loading" });
    try {
      const { b64, filename } = await generateBytes(
        "/api/contracts/generate",
        "contrato.docx",
      );
      const signLines = signatures
        .map((s) => {
          const link = s.link?.short_link;
          return link ? `• ${s.name} (${s.email}): ${link}` : null;
        })
        .filter((l): l is string => l !== null);
      const message = signLines.length
        ? `Contrato Direto - ${nomeCliente.trim()}\nLinks de assinatura:\n${signLines.join("\n")}`
        : undefined;

      const r = await fetch(`${API_BASE}/api/contracts/slack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_bytes_b64: b64,
          filename,
          ...(message ? { message } : {}),
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({ detail: "Erro" }));
        throw new Error(err.detail || `HTTP ${r.status}`);
      }
      const data = await r.json();
      setSlackStatus({
        type: "success",
        message: data.message || "Enviado para o Slack!",
      });
    } catch (e) {
      setSlackStatus({
        type: "error",
        message: e instanceof Error ? e.message : "Erro ao enviar para o Slack",
      });
    }
  }

  if (!expanded) {
    if (controlled) return null;
    return (
      <Button
        onClick={() => setExpanded(true)}
        className="w-full mt-5 bg-card border border-border text-foreground hover:border-primary/60"
        variant="outline"
      >
        <FileText className="mr-2 h-4 w-4" /> Gerar Contrato Direto
      </Button>
    );
  }

  return (
    <div className="mt-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-2xl border border-border bg-card p-7 space-y-6">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-primary">
            Contrato Direto (modular)
          </p>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Section 1: Serviços */}
        <section>
          <h3 className="text-sm font-semibold mb-3">Serviços</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {SERVICES.map((s) => (
              <label
                key={s.key}
                htmlFor={`svc-${s.key}`}
                className={cn(
                  "flex items-center gap-3 rounded-xl border bg-background p-3 cursor-pointer",
                  selected.has(s.key) ? "border-primary" : "border-border",
                )}
              >
                <Checkbox
                  id={`svc-${s.key}`}
                  checked={selected.has(s.key)}
                  onCheckedChange={() => toggleService(s.key)}
                />
                <span className="text-sm">{s.label}</span>
              </label>
            ))}
          </div>
          {validationErrors.map((e, i) => (
            <p
              key={i}
              className="mt-2 text-xs text-destructive flex items-center gap-1"
            >
              <AlertCircle className="h-3 w-3 shrink-0" /> {e}
            </p>
          ))}
        </section>

        <div className="border-t border-border" />

        {/* Section 2: Formato */}
        <section>
          <h3 className="text-sm font-semibold mb-3">Formato do documento</h3>
          <RadioGroup
            value={formato}
            onValueChange={(v) => setFormato(v as "completo" | "order")}
            className="space-y-2"
          >
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <RadioGroupItem value="completo" /> Contrato completo (16 cláusulas)
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <RadioGroupItem value="order" /> Order (vinculado ao Master)
            </label>
          </RadioGroup>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label>Nº de referência</Label>
              <Input
                value={refNum}
                onChange={(e) => setRefNum(e.target.value)}
                placeholder="0000"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <Checkbox
                  checked={rascunho}
                  onCheckedChange={(c) => setRascunho(c === true)}
                />
                Marcar como rascunho
              </label>
            </div>
          </div>

          {formato === "order" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label>Nº do Master</Label>
                <Input
                  value={masterNum}
                  onChange={(e) => setMasterNum(e.target.value)}
                  placeholder="001"
                />
              </div>
              <div className="space-y-2">
                <Label>Data do Master</Label>
                <Input
                  value={masterData}
                  onChange={(e) => setMasterData(e.target.value)}
                  placeholder="29/06/2026"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Link do Master (URL)</Label>
                <Input
                  value={masterLink}
                  onChange={(e) => setMasterLink(e.target.value)}
                  placeholder="https://…"
                />
              </div>
            </div>
          )}
        </section>

        {selectedKeys.length > 0 && (
          <>
            <div className="border-t border-border" />

            {/* Section 3: Valores por serviço */}
            <section>
              <h3 className="text-sm font-semibold mb-3">Valores</h3>
              <div className="space-y-4">
                {selected.has("turnaround") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Turnaround — valor fixo (R$)</Label>
                      <Input
                        value={turnFixo}
                        onChange={(e) => setTurnFixo(e.target.value)}
                        placeholder="Ex: 30.000,00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Turnaround — % êxito</Label>
                      <Input
                        value={turnPct}
                        onChange={(e) => setTurnPct(e.target.value)}
                        placeholder="3"
                      />
                    </div>
                  </div>
                )}

                {hasSetup && (
                  <div className="space-y-2">
                    <Label>Valor total do Setup (R$)</Label>
                    <Input
                      value={valorSetup}
                      onChange={(e) => setValorSetup(e.target.value)}
                      placeholder="Ex: 12.000,00"
                    />
                  </div>
                )}

                {recurring.map((k) => (
                  <div key={k} className="space-y-2">
                    <Label>MRR — {META[k].label} (R$)</Label>
                    <Input
                      value={mrr[k] || ""}
                      onChange={(e) =>
                        setMrr((prev) => ({ ...prev, [k]: e.target.value }))
                      }
                      placeholder="Ex: 2.500,00"
                    />
                  </div>
                ))}

                {recurring.length > 0 && (
                  <div className="rounded-lg bg-primary/10 px-3 py-2 text-sm">
                    MRR total:{" "}
                    <span className="font-medium text-primary">
                      {formatBRLNumber(mrrTotalNum)}
                    </span>
                  </div>
                )}

                {selected.has("oxy") && !oxyProjeto && (
                  <p className="text-xs text-muted-foreground flex items-start gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0 mt-0.5 text-yellow-500" />
                    Plataforma Oxy + Gênio: isenta nos primeiros 12 meses.
                  </p>
                )}

                {pontuais.map((k) => (
                  <div key={k} className="space-y-2">
                    <Label>
                      Valor do projeto — {META[k].label} (R$)
                    </Label>
                    <Input
                      value={valorPontual[k] || ""}
                      onChange={(e) =>
                        setValorPontual((prev) => ({
                          ...prev,
                          [k]: e.target.value,
                        }))
                      }
                      placeholder="Ex: 8.000,00"
                    />
                  </div>
                ))}

                {selected.has("bpo") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>BPO — lançamentos/dia</Label>
                      <Input
                        type="number"
                        min={1}
                        value={bpoLancamentos}
                        onChange={(e) => setBpoLancamentos(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>BPO — contas bancárias</Label>
                      <Input
                        type="number"
                        min={1}
                        value={bpoContas}
                        onChange={(e) => setBpoContas(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {/* Section 4: Forma de pagamento do Setup */}
        {showPagamento && (
          <>
            <div className="border-t border-border" />
            <section>
              <h3 className="text-sm font-semibold mb-3">
                Forma de pagamento do Setup
              </h3>
              <div className="rounded-lg bg-background border border-border px-3 py-2 text-sm mb-4">
                Base:{" "}
                <span className="font-medium">
                  {formatBRLNumber(pagamentoBaseNum)}
                </span>
              </div>
              <div className="space-y-2 max-w-sm">
                <Label>Forma de pagamento</Label>
                <Select
                  value={formaPgto}
                  onValueChange={(v) => setFormaPgto(v as FormaPagamento)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cartao">Cartão de Crédito</SelectItem>
                    <SelectItem value="boleto">Boleto Bancário</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cartao_boleto">Cartão + Boleto</SelectItem>
                    <SelectItem value="pix_boleto">PIX + Boleto</SelectItem>
                    <SelectItem value="custom">
                      Personalizado (compor várias formas)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-4 space-y-4">
                {formaPgto === "cartao" && (
                  <div className="space-y-2 max-w-xs">
                    <Label>Parcelas no cartão</Label>
                    <Input
                      type="number"
                      min={1}
                      value={cartaoParcelas}
                      onChange={(e) => setCartaoParcelas(e.target.value)}
                    />
                    <PerInstallment valor={baseStr} parcelas={cartaoParcelas} />
                  </div>
                )}

                {formaPgto === "boleto" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Parcelas no boleto</Label>
                      <Input
                        type="number"
                        min={1}
                        value={boletoParcelas}
                        onChange={(e) => setBoletoParcelas(e.target.value)}
                      />
                      <PerInstallment valor={baseStr} parcelas={boletoParcelas} />
                    </div>
                    <div className="space-y-2">
                      <Label>Vencimento do boleto</Label>
                      <Input
                        type="date"
                        value={boletoData}
                        onChange={(e) => setBoletoData(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {formaPgto === "cartao_boleto" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Valor pago em boleto (R$)</Label>
                      <Input
                        value={compVb}
                        onChange={(e) => setCompVb(e.target.value)}
                        placeholder="Ex: 4.000,00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Parcelas no boleto (1-3)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={3}
                        value={compQb}
                        onChange={(e) => setCompQb(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Parcelas no cartão</Label>
                      <Input
                        type="number"
                        min={1}
                        value={compNc}
                        onChange={(e) => setCompNc(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {formaPgto === "pix_boleto" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Valor pago em boleto (R$)</Label>
                      <Input
                        value={compVb}
                        onChange={(e) => setCompVb(e.target.value)}
                        placeholder="Ex: 4.000,00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Parcelas no boleto (1-3)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={3}
                        value={compQb}
                        onChange={(e) => setCompQb(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Vencimento do boleto</Label>
                      <Input
                        type="date"
                        value={compDt}
                        onChange={(e) => setCompDt(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {formaPgto === "custom" && (
                  <div className="space-y-3">
                    <div className="space-y-2 max-w-xs">
                      <Label>Número de formas (1-4)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={4}
                        value={customCount}
                        onChange={(e) => {
                          const n = Math.max(
                            1,
                            Math.min(4, Number(e.target.value) || 1),
                          );
                          setCustomCount(n);
                          setCustomLines((prev) => {
                            const next = [...prev];
                            while (next.length < n)
                              next.push({
                                forma: "pix",
                                valor: "",
                                parcelas: "1",
                                data: "",
                              });
                            return next.slice(0, n);
                          });
                        }}
                      />
                    </div>
                    {customLines.slice(0, customCount).map((line, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-xl border border-border bg-background p-3"
                      >
                        <div className="space-y-2">
                          <Label className="text-xs">Forma</Label>
                          <Select
                            value={line.forma}
                            onValueChange={(v) =>
                              setCustomLines((prev) => {
                                const next = [...prev];
                                next[i] = { ...next[i], forma: v as LinhaForma };
                                return next;
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pix">PIX</SelectItem>
                              <SelectItem value="boleto">Boleto</SelectItem>
                              <SelectItem value="cartao">Cartão</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Valor (R$)</Label>
                          <Input
                            value={line.valor}
                            onChange={(e) =>
                              setCustomLines((prev) => {
                                const next = [...prev];
                                next[i] = { ...next[i], valor: e.target.value };
                                return next;
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Parcelas</Label>
                          <Input
                            type="number"
                            min={1}
                            value={line.parcelas}
                            onChange={(e) =>
                              setCustomLines((prev) => {
                                const next = [...prev];
                                next[i] = {
                                  ...next[i],
                                  parcelas: e.target.value,
                                };
                                return next;
                              })
                            }
                          />
                          <PerInstallment
                            valor={line.valor}
                            parcelas={line.parcelas}
                          />
                        </div>
                        {line.forma === "boleto" && (
                          <div className="space-y-2">
                            <Label className="text-xs">Vencimento</Label>
                            <Input
                              type="date"
                              value={line.data}
                              onChange={(e) =>
                                setCustomLines((prev) => {
                                  const next = [...prev];
                                  next[i] = { ...next[i], data: e.target.value };
                                  return next;
                                })
                              }
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Balance note */}
                {pagamentoBaseNum > 0 && (
                  <div
                    className={cn(
                      "text-sm rounded-lg px-3 py-2 flex items-center gap-2",
                      pagamentoBalance === "ok"
                        ? "bg-primary/10 text-primary"
                        : "bg-destructive/10 text-destructive",
                    )}
                  >
                    {pagamentoBalance === "ok" ? (
                      <>
                        <CheckCircle className="h-4 w-4 shrink-0" />
                        Soma das formas confere com a base (
                        {formatBRLNumber(pagamentoSomaNum)}).
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        As formas {pagamentoBalance === "excedem"
                          ? "excedem"
                          : "ficam aquém d"}
                        a base: {formatBRLNumber(pagamentoSomaNum)} vs{" "}
                        {formatBRLNumber(pagamentoBaseNum)}.
                      </>
                    )}
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {/* Section 5: Aviso prévio */}
        {selectedKeys.length > 0 && (
          <>
            <div className="border-t border-border" />
            <section>
              <h3 className="text-sm font-semibold mb-3">Aviso prévio</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedKeys.map((k) => (
                  <div key={k} className="space-y-2">
                    <Label>{META[k].label}</Label>
                    <Select
                      value={avisoFor(k)}
                      onValueChange={(v) =>
                        setAvisos((prev) => ({ ...prev, [k]: v as Aviso }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 dias</SelectItem>
                        <SelectItem value="60">60 dias</SelectItem>
                        <SelectItem value="90">90 dias</SelectItem>
                        <SelectItem value="na">Não se aplica (pontual)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        <div className="border-t border-border" />

        {/* Section 6: Condições gerais */}
        <section>
          <h3 className="text-sm font-semibold mb-3">Condições gerais</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vigência (meses)</Label>
              <Input
                type="number"
                min={1}
                value={vigencia}
                onChange={(e) => setVigencia(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data do contrato</Label>
              <Input
                type="date"
                value={dataContrato}
                onChange={(e) => setDataContrato(e.target.value)}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Foro</Label>
              <Input
                value={foro}
                onChange={(e) => setForo(e.target.value)}
                placeholder="Comarca de São Paulo/SP"
              />
            </div>
          </div>
        </section>

        <div className="border-t border-border" />

        {/* Section 7: Empresa */}
        <section>
          <h3 className="text-sm font-semibold mb-3">Dados do Contratante</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label>Nome da empresa</Label>
              <Input
                value={nomeCliente}
                onChange={(e) => setNomeCliente(e.target.value)}
                placeholder="Ex: Empresa XYZ Ltda"
              />
            </div>
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input
                value={cnpj}
                onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                placeholder="XX.XXX.XXX/XXXX-XX"
              />
            </div>
            <div className="space-y-2">
              <Label>CEP da empresa</Label>
              <Input
                value={cep}
                onChange={(e) =>
                  setCep(e.target.value.replace(/\D/g, "").slice(0, 8))
                }
                placeholder="Ex: 01452001"
              />
              {cepLoading && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Buscando endereço…
                </p>
              )}
              {!cepLoading && cep.length === 8 && !cepData && (
                <p className="text-xs text-destructive">CEP não encontrado</p>
              )}
            </div>
            {cepData && (
              <>
                <div className="md:col-span-2 text-sm text-primary rounded-lg bg-primary/10 px-3 py-2">
                  {cepData.logradouro}, {cepData.bairro} — {cepData.localidade}/
                  {cepData.uf}
                </div>
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    placeholder="Ex: 1811"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Complemento</Label>
                  <Input
                    value={complemento}
                    onChange={(e) => setComplemento(e.target.value)}
                    placeholder="Ex: Sala 10"
                  />
                </div>
              </>
            )}
          </div>
        </section>

        <div className="border-t border-border" />

        {/* Actions */}
        <section className="space-y-3">
          {apiOk === false && (
            <div className="flex items-center gap-2 text-sm rounded-lg px-3 py-2 bg-destructive/10 text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              API de contratos indisponível ({API_BASE}). A geração não
              funcionará.
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleGenerateAndDrive}
              disabled={!isValid || makeStatus.type === "loading"}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {makeStatus.type === "loading" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              Fazer contrato
            </Button>
          </div>

          {makeStatus.type === "error" && (
            <div className="flex items-center gap-2 text-sm rounded-lg px-3 py-2 bg-destructive/10 text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {makeStatus.message}
            </div>
          )}

          {makeStatus.type === "success" && driveResult && (
            <div className="rounded-lg bg-primary/10 px-3 py-2 text-sm space-y-2">
              <p className="text-primary flex items-center gap-1">
                <CheckCircle className="h-4 w-4 shrink-0" />
                {makeStatus.message}
              </p>
              <p className="text-xs text-muted-foreground">
                Pasta: <span className="text-foreground">{driveResult.pasta}</span>
              </p>
              <div className="flex flex-col gap-1">
                <a
                  href={driveResult.docx_link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline"
                >
                  📄 DOCX no Drive
                </a>
                {driveResult.pdf_link ? (
                  <a
                    href={driveResult.pdf_link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline"
                  >
                    📑 PDF no Drive
                  </a>
                ) : (
                  <p className="text-xs text-yellow-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    PDF não foi gerado.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Integration actions — available once a valid contract can be generated */}
          {isValid && (
            <div className="space-y-3 pt-1">
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => setShowAutentique((v) => !v)}
                  variant="outline"
                >
                  <PenLine className="mr-2 h-4 w-4" />
                  Assinatura
                </Button>
                <Button
                  onClick={() => {
                    setShowIpag((v) => {
                      const next = !v;
                      if (next && !ipagValor && pagamentoBaseNum > 0)
                        setIpagValor(String(pagamentoBaseNum));
                      return next;
                    });
                  }}
                  variant="outline"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Link Pagamento
                </Button>
                <Button
                  onClick={handleDrive}
                  disabled={driveStatus.type === "loading"}
                  variant="outline"
                >
                  {driveStatus.type === "loading" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Enviar para o Drive
                </Button>
                <Button
                  onClick={handleSlack}
                  disabled={slackStatus.type === "loading"}
                  variant="outline"
                >
                  {slackStatus.type === "loading" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Enviar para o Slack
                </Button>
              </div>

              {/* Drive / Slack status */}
              {[driveStatus, slackStatus].map((s, i) =>
                s.type === "success" || s.type === "error" ? (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-2 text-sm rounded-lg px-3 py-2",
                      s.type === "success"
                        ? "bg-primary/10 text-primary"
                        : "bg-destructive/10 text-destructive",
                    )}
                  >
                    {s.type === "success" ? (
                      <CheckCircle className="h-4 w-4 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0" />
                    )}
                    {s.message}
                  </div>
                ) : null,
              )}
              {driveStatus.type === "success" && driveLink && (
                <div className="font-mono text-xs bg-primary/10 rounded px-2 py-1 break-all">
                  <a
                    href={driveLink}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    {driveLink}
                  </a>
                </div>
              )}

              {/* Autentique panel */}
              {showAutentique && (
                <div className="rounded-xl border border-border bg-background p-4 space-y-3">
                  <p className="text-sm font-medium">Enviar para Assinatura</p>
                  <div className="space-y-2">
                    <Label>E-mail do contratante</Label>
                    <Input
                      type="email"
                      value={emailContratante}
                      onChange={(e) => setEmailContratante(e.target.value)}
                      placeholder="cliente@empresa.com.br"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={autSandbox}
                      onCheckedChange={(c) => setAutSandbox(c === true)}
                    />
                    Modo teste (sandbox)
                  </label>
                  <Button
                    onClick={handleAutentique}
                    disabled={
                      !emailContratante.trim() || autStatus.type === "loading"
                    }
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {autStatus.type === "loading" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <PenLine className="mr-2 h-4 w-4" />
                    )}
                    Enviar para assinatura
                  </Button>
                  {autStatus.type === "success" && (
                    <div className="text-sm text-primary space-y-2">
                      <p className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 shrink-0" />
                        {autStatus.message}
                      </p>
                      {signingLink && (
                        <div className="font-mono text-xs bg-primary/10 rounded px-2 py-1 break-all">
                          <a
                            href={signingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="underline"
                          >
                            {signingLink}
                          </a>
                        </div>
                      )}
                      {signatures.length > 0 && (
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          {signatures.map((sig, i) => (
                            <li
                              key={i}
                              className="flex items-center justify-between gap-2"
                            >
                              <span>
                                {sig.name} — {sig.email}
                              </span>
                              {sig.link?.short_link && (
                                <a
                                  href={sig.link.short_link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="underline text-primary shrink-0"
                                >
                                  Assinar
                                </a>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                  {autStatus.type === "error" && (
                    <div className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {autStatus.message}
                    </div>
                  )}
                </div>
              )}

              {/* iPag panel */}
              {showIpag && (
                <div className="rounded-xl border border-border bg-background p-4 space-y-3">
                  <p className="text-sm font-medium">Link de Pagamento (iPag)</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label>Valor (R$)</Label>
                      <Input
                        value={ipagValor}
                        onChange={(e) => setIpagValor(e.target.value)}
                        placeholder="Ex: 12.000,00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Máx. parcelas</Label>
                      <Input
                        type="number"
                        min={1}
                        max={12}
                        value={ipagParcelas}
                        onChange={(e) =>
                          setIpagParcelas(Number(e.target.value) || 12)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Parcelas sem juros</Label>
                      <Input
                        type="number"
                        min={1}
                        max={12}
                        value={ipagSemJuros}
                        onChange={(e) =>
                          setIpagSemJuros(Number(e.target.value) || 1)
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Input
                      value={ipagDescricao}
                      onChange={(e) => setIpagDescricao(e.target.value)}
                      placeholder="Descrição da cobrança"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={ipagSandbox}
                      onCheckedChange={(c) => setIpagSandbox(c === true)}
                    />
                    Modo teste (sandbox)
                  </label>
                  <Button
                    onClick={handleIpag}
                    disabled={
                      !parseMoney(ipagValor) || ipagStatus.type === "loading"
                    }
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {ipagStatus.type === "loading" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard className="mr-2 h-4 w-4" />
                    )}
                    Gerar link de pagamento
                  </Button>
                  {ipagStatus.type === "success" && paymentLink && (
                    <div className="text-sm text-primary space-y-2">
                      <p className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 shrink-0" />
                        {ipagStatus.message}
                      </p>
                      <div className="font-mono text-xs bg-primary/10 rounded px-2 py-1 break-all">
                        <a
                          href={paymentLink}
                          target="_blank"
                          rel="noreferrer"
                          className="underline"
                        >
                          {paymentLink}
                        </a>
                      </div>
                    </div>
                  )}
                  {ipagStatus.type === "error" && (
                    <div className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {ipagStatus.message}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ── Per-installment helper ──

function PerInstallment({
  valor,
  parcelas,
}: {
  valor: string;
  parcelas: string;
}) {
  const v = parseMoney(valor);
  const n = Number(parcelas) || 0;
  if (!v || n < 1) return null;
  return (
    <p className="text-xs text-muted-foreground">
      {n}x de {formatBRLNumber(v / n)}
    </p>
  );
}
