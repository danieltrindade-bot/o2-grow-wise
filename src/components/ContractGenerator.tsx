import { useCallback, useEffect, useRef, useState } from "react";
import {
  FileText,
  Send,
  CreditCard,
  Download,
  Plus,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  PenLine,
  Upload,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

const API_BASE =
  import.meta.env.VITE_CONTRACT_API_URL || "http://localhost:8000";

// ── Types ──

export interface ContractGeneratorProps {
  modelo:
    | "SaaS Oxy + Gênio"
    | "CFO Enterprise"
    | "BPO Financeiro"
    | "Assessoria Financeira"
    | "Coordenador as a Service";
  clientName?: string;
  valorSetup?: string;
  valorMensal?: string;
  qtdParcelasSetup?: number;
  volContasReceber?: number;
  volContasPagar?: number;
  qtdBancos?: number;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

interface LinkedCompany {
  razao_social: string;
  cnpj: string;
}

interface CepData {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  cep: string;
}

type ActionStatus = {
  type: "idle" | "loading" | "success" | "error";
  message?: string;
};

// ── Formatters ──

function formatCNPJ(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12)
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

function formatCPF(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9)
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function formatCurrency(v: string): string {
  const digits = v.replace(/\D/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ── CEP Hook ──

function useCepLookup() {
  const cache = useRef<Map<string, CepData>>(new Map());

  const lookup = useCallback(
    async (cep: string): Promise<CepData | null> => {
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
    },
    [],
  );

  return lookup;
}

// ── Address Block ──

function AddressBlock({
  label,
  cep,
  onCepChange,
  numero,
  onNumeroChange,
  complemento,
  onComplementoChange,
  cepData,
  loading,
}: {
  label: string;
  cep: string;
  onCepChange: (v: string) => void;
  numero: string;
  onNumeroChange: (v: string) => void;
  complemento: string;
  onComplementoChange: (v: string) => void;
  cepData: CepData | null;
  loading?: boolean;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label>{label}</Label>
        <Input
          value={cep}
          onChange={(e) => onCepChange(e.target.value.replace(/\D/g, "").slice(0, 8))}
          placeholder="Ex: 01452001"
        />
        {loading && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> Buscando endereço…
          </p>
        )}
        {!loading && cep.length === 8 && !cepData && (
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
              onChange={(e) => onNumeroChange(e.target.value)}
              placeholder="Ex: 1811"
            />
          </div>
          <div className="space-y-2">
            <Label>Complemento</Label>
            <Input
              value={complemento}
              onChange={(e) => onComplementoChange(e.target.value)}
              placeholder="Ex: Sala 10"
            />
          </div>
        </>
      )}
    </>
  );
}

// ── Main Component ──

export function ContractGenerator(props: ContractGeneratorProps) {
  const {
    modelo,
    clientName = "",
    valorSetup = "",
    valorMensal = "",
    qtdParcelasSetup = 12,
    volContasReceber,
    volContasPagar,
    qtdBancos,
    expanded: controlledExpanded,
    onExpandedChange,
  } = props;

  const controlled = onExpandedChange !== undefined;
  const [internalExpanded, setInternalExpanded] = useState(false);
  const expanded = controlled ? (controlledExpanded ?? false) : internalExpanded;
  const setExpanded = controlled ? onExpandedChange! : setInternalExpanded;

  // Form state
  const [nomeCliente, setNomeCliente] = useState(clientName);
  const [emailAssinante, setEmailAssinante] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [cepEmp, setCepEmp] = useState("");
  const [cepEmpData, setCepEmpData] = useState<CepData | null>(null);
  const [cepEmpLoading, setCepEmpLoading] = useState(false);
  const [numEmp, setNumEmp] = useState("");
  const [complEmp, setComplEmp] = useState("");

  const [nomeSocio, setNomeSocio] = useState("");
  const [cpfSocio, setCpfSocio] = useState("");
  const [cepSoc, setCepSoc] = useState("");
  const [cepSocData, setCepSocData] = useState<CepData | null>(null);
  const [cepSocLoading, setCepSocLoading] = useState(false);
  const [numSoc, setNumSoc] = useState("");
  const [complSoc, setComplSoc] = useState("");

  const [vinculadas, setVinculadas] = useState<LinkedCompany[]>([]);
  const [showVinculadas, setShowVinculadas] = useState(false);

  const [vSetup, setVSetup] = useState(() => formatCurrency(valorSetup));
  const [formaSetup, setFormaSetup] = useState("cartao");
  const [parcSetup, setParcSetup] = useState(qtdParcelasSetup);
  const [vMensal, setVMensal] = useState(() => formatCurrency(valorMensal));
  const [formaMensal, setFormaMensal] = useState("boleto");
  const [inicioRec, setInicioRec] = useState(90);
  const [antecedencia, setAntecedencia] = useState(30);

  // Autentique
  const [emailContratante, setEmailContratante] = useState("");
  const [showAutentique, setShowAutentique] = useState(false);
  const [autSandbox, setAutSandbox] = useState(false);

  // iPag
  const [showIpag, setShowIpag] = useState(false);
  const [ipagParcelas, setIpagParcelas] = useState(12);
  const [ipagSemJuros, setIpagSemJuros] = useState(3);

  // Generated contract bytes (base64)
  const [contractB64, setContractB64] = useState<string | null>(null);
  const [contractFilename, setContractFilename] = useState("");

  // API health
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  // Action states
  const [generateStatus, setGenerateStatus] = useState<ActionStatus>({
    type: "idle",
  });
  const [pdfStatus, setPdfStatus] = useState<ActionStatus>({ type: "idle" });
  const [slackStatus, setSlackStatus] = useState<ActionStatus>({
    type: "idle",
  });
  const [autStatus, setAutStatus] = useState<ActionStatus>({ type: "idle" });
  const [ipagStatus, setIpagStatus] = useState<ActionStatus>({ type: "idle" });
  const [signingLink, setSigningLink] = useState("");
  const [paymentLink, setPaymentLink] = useState("");

  // Document extraction
  const [extractStatus, setExtractStatus] = useState<ActionStatus>({ type: "idle" });
  const [extractWarnings, setExtractWarnings] = useState<string[]>([]);
  const [extractedFields, setExtractedFields] = useState<string[]>([]);
  const csFileRef = useRef<HTMLInputElement>(null);
  const cnhFileRef = useRef<HTMLInputElement>(null);

  const cepLookup = useCepLookup();
  const cepEmpTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const cepSocTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (clientName) setNomeCliente(clientName);
  }, [clientName]);

  useEffect(() => {
    if (!expanded) return;
    fetch(`${API_BASE}/api/health`)
      .then((r) => setApiOk(r.ok))
      .catch(() => setApiOk(false));
  }, [expanded]);

  useEffect(() => {
    setVSetup(formatCurrency(valorSetup));
  }, [valorSetup]);

  useEffect(() => {
    setVMensal(formatCurrency(valorMensal));
  }, [valorMensal]);

  // CEP auto-lookup with debounce
  useEffect(() => {
    clearTimeout(cepEmpTimer.current);
    if (cepEmp.length === 8) {
      setCepEmpLoading(true);
      cepEmpTimer.current = setTimeout(async () => {
        const data = await cepLookup(cepEmp);
        setCepEmpData(data);
        setCepEmpLoading(false);
      }, 400);
    } else {
      setCepEmpData(null);
      setCepEmpLoading(false);
    }
  }, [cepEmp, cepLookup]);

  useEffect(() => {
    clearTimeout(cepSocTimer.current);
    if (cepSoc.length === 8) {
      setCepSocLoading(true);
      cepSocTimer.current = setTimeout(async () => {
        const data = await cepLookup(cepSoc);
        setCepSocData(data);
        setCepSocLoading(false);
      }, 400);
    } else {
      setCepSocData(null);
      setCepSocLoading(false);
    }
  }, [cepSoc, cepLookup]);

  // Build full addresses
  const enderecoEmpresa = cepEmpData
    ? [
        cepEmpData.logradouro,
        numEmp ? `, ${numEmp}` : "",
        complEmp ? `, ${complEmp}` : "",
        cepEmpData.bairro ? `, ${cepEmpData.bairro}` : "",
        `, ${cepEmpData.localidade} - ${cepEmpData.uf}`,
        `, CEP ${cepEmpData.cep}`,
      ].join("")
    : "";

  const enderecoSocio = cepSocData
    ? [
        cepSocData.logradouro,
        numSoc ? `, ${numSoc}` : "",
        complSoc ? `, ${complSoc}` : "",
        cepSocData.bairro ? `, ${cepSocData.bairro}` : "",
        `, ${cepSocData.localidade} - ${cepSocData.uf}`,
        `, CEP ${cepSocData.cep}`,
      ].join("")
    : "";

  const parcelaSetup =
    vSetup && parcSetup
      ? (() => {
          const clean = vSetup.replace(/\D/g, "");
          if (!clean) return "";
          const val = parseInt(clean, 10) / 100;
          return (val / parcSetup).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          });
        })()
      : "";

  const isValid =
    nomeCliente.trim() &&
    cnpj.replace(/\D/g, "").length === 14 &&
    enderecoEmpresa &&
    nomeSocio.trim() &&
    cpfSocio.replace(/\D/g, "").length === 11 &&
    enderecoSocio &&
    vSetup.trim() &&
    vMensal.trim();

  async function handleExtract() {
    const csFile = csFileRef.current?.files?.[0];
    const cnhFile = cnhFileRef.current?.files?.[0];
    if (!csFile && !cnhFile) return;

    setExtractStatus({ type: "loading" });
    setExtractWarnings([]);
    setExtractedFields([]);

    try {
      const formData = new FormData();
      if (csFile) formData.append("contrato_social", csFile);
      if (cnhFile) formData.append("cnh", cnhFile);

      const r = await fetch(`${API_BASE}/api/contracts/extract`, {
        method: "POST",
        body: formData,
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({ detail: "Erro" }));
        throw new Error(err.detail);
      }
      const data = await r.json();
      const filled: string[] = [];

      if (data.empresa.razao_social) {
        setNomeCliente(data.empresa.razao_social);
        filled.push(`Razão Social: ${data.empresa.razao_social}`);
      }
      if (data.empresa.cnpj) {
        setCnpj(formatCNPJ(data.empresa.cnpj));
        filled.push(`CNPJ: ${formatCNPJ(data.empresa.cnpj)}`);
      }
      if (data.empresa.cep) {
        setCepEmp(data.empresa.cep.replace(/\D/g, ""));
        filled.push(`CEP empresa: ${data.empresa.cep}`);
      }
      if (data.empresa.socio_nome || data.cnh.nome) {
        const nome = data.empresa.socio_nome || data.cnh.nome;
        setNomeSocio(nome);
        filled.push(`Sócio: ${nome}`);
      }
      if (data.empresa.socio_cpf || data.cnh.cpf) {
        const cpf = data.empresa.socio_cpf || data.cnh.cpf;
        setCpfSocio(formatCPF(cpf));
        filled.push(`CPF sócio: ${formatCPF(cpf)}`);
      }
      if (data.empresa.socio_cep) {
        setCepSoc(data.empresa.socio_cep.replace(/\D/g, ""));
        filled.push(`CEP sócio: ${data.empresa.socio_cep}`);
      }

      setExtractWarnings(data.avisos || []);
      setExtractedFields(filled);
      setExtractStatus({
        type: filled.length > 0 ? "success" : "error",
        message: filled.length > 0
          ? `${filled.length} campo(s) extraído(s)${data.usou_ocr ? " via OCR" : ""} — revise antes de gerar`
          : "Nenhum dado encontrado nos documentos",
      });
    } catch (e) {
      setExtractStatus({
        type: "error",
        message: e instanceof Error ? e.message : "Erro ao extrair dados",
      });
    }
  }

  // Build request payload
  function buildPayload() {
    const setupClean = vSetup.replace(/\D/g, "");
    const mensalClean = vMensal.replace(/\D/g, "");
    const setupVal = setupClean ? (parseInt(setupClean, 10) / 100).toFixed(2) : "0";
    const mensalVal = mensalClean ? (parseInt(mensalClean, 10) / 100).toFixed(2) : "0";
    const parcelaVal = setupClean
      ? (parseInt(setupClean, 10) / 100 / parcSetup).toFixed(2)
      : "0";

    const payload: Record<string, unknown> = {
      modelo,
      nome_cliente: nomeCliente.trim(),
      cnpj: cnpj.replace(/\D/g, ""),
      endereco_empresa: enderecoEmpresa,
      nome_socio: nomeSocio.trim(),
      cpf_socio: cpfSocio.replace(/\D/g, ""),
      endereco_socio: enderecoSocio,
      email_assinante: emailAssinante.trim(),
      empresas_vinculadas: vinculadas.filter(
        (v) => v.razao_social.trim() && v.cnpj.trim(),
      ),
      valor_setup: setupVal,
      forma_pagamento_setup: formaSetup,
      qtd_parcelas_setup: String(parcSetup),
      valor_parcela_setup: parcelaVal,
      valor_mensal: mensalVal,
      forma_pagamento_mensal: formaMensal,
      inicio_recorrencia: String(inicioRec),
      antecedencia_dias: String(antecedencia),
    };

    if (modelo === "BPO Financeiro") {
      payload.vol_contas_receber = String(volContasReceber ?? 0);
      payload.vol_contas_pagar = String(volContasPagar ?? 0);
      payload.vol_total = String(
        (volContasReceber ?? 0) + (volContasPagar ?? 0),
      );
      payload.qtd_bancos = String(qtdBancos ?? 0);
    }

    return payload;
  }

  async function handleGenerate() {
    setGenerateStatus({ type: "loading" });
    try {
      const r = await fetch(`${API_BASE}/api/contracts/generate`, {
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
      const fname = match?.[1] || "contrato.docx";
      setContractFilename(fname);

      const arrayBuf = await blob.arrayBuffer();
      const b64 = btoa(
        new Uint8Array(arrayBuf).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          "",
        ),
      );
      setContractB64(b64);

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fname;
      a.click();
      URL.revokeObjectURL(url);

      setGenerateStatus({
        type: "success",
        message: "Contrato gerado e baixado!",
      });
    } catch (e) {
      setGenerateStatus({
        type: "error",
        message: e instanceof Error ? e.message : "Erro ao gerar contrato",
      });
    }
  }

  async function handlePDF() {
    setPdfStatus({ type: "loading" });
    try {
      const r = await fetch(`${API_BASE}/api/contracts/generate-pdf`, {
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
      const fname = match?.[1] || "contrato.pdf";

      const arrayBuf = await blob.arrayBuffer();
      const b64 = btoa(
        new Uint8Array(arrayBuf).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          "",
        ),
      );
      setContractB64(b64);
      setContractFilename(fname);

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fname;
      a.click();
      URL.revokeObjectURL(url);

      setPdfStatus({ type: "success", message: "PDF gerado e baixado!" });
    } catch (e) {
      setPdfStatus({
        type: "error",
        message: e instanceof Error ? e.message : "Erro ao gerar PDF",
      });
    }
  }

  async function handleSlack() {
    if (!contractB64) return;
    setSlackStatus({ type: "loading" });
    try {
      const r = await fetch(`${API_BASE}/api/contracts/slack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_bytes_b64: contractB64,
          filename: contractFilename,
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({ detail: "Erro" }));
        throw new Error(err.detail);
      }
      setSlackStatus({
        type: "success",
        message: "Contrato enviado para o Slack!",
      });
    } catch (e) {
      setSlackStatus({
        type: "error",
        message: e instanceof Error ? e.message : "Erro ao enviar",
      });
    }
  }

  async function handleAutentique() {
    if (!contractB64 || !emailContratante.trim()) return;
    setAutStatus({ type: "loading" });
    try {
      const r = await fetch(`${API_BASE}/api/contracts/autentique`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_bytes_b64: contractB64,
          filename: contractFilename,
          doc_name: `Contrato ${modelo} - ${nomeCliente} & O2 Inc`,
          email_contratante: emailContratante.trim(),
          nome_contratante: nomeCliente.trim(),
          sandbox: autSandbox,
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({ detail: "Erro" }));
        throw new Error(err.detail);
      }
      const data = await r.json();
      setSigningLink(data.client_signing_link || "");
      setAutStatus({
        type: "success",
        message: "Enviado para assinatura!",
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
    const setupClean = vSetup.replace(/\D/g, "");
    const valor = setupClean ? parseInt(setupClean, 10) / 100 : 0;
    try {
      const r = await fetch(`${API_BASE}/api/contracts/ipag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          valor,
          descricao: `${nomeCliente.trim()} - Contrato ${modelo}`,
          max_parcelas: ipagParcelas,
          parcelas_sem_juros: ipagSemJuros,
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({ detail: "Erro" }));
        throw new Error(err.detail);
      }
      const data = await r.json();
      setPaymentLink(data.payment_link || "");
      setIpagStatus({
        type: "success",
        message: "Link de pagamento gerado!",
      });
    } catch (e) {
      setIpagStatus({
        type: "error",
        message: e instanceof Error ? e.message : "Erro ao gerar link",
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
        <FileText className="mr-2 h-4 w-4" /> Gerar Contrato
      </Button>
    );
  }

  return (
    <div className="mt-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-2xl border border-border bg-card p-7 space-y-6">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-primary">
            Gerador de Contrato
          </p>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Section 0: Document Extraction */}
        <section className="rounded-xl border border-border bg-background p-4 space-y-3">
          <p className="text-sm font-medium flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" />
            Preencher automaticamente via Contrato Social / CNH
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Contrato Social (PDF)</Label>
              <input
                ref={csFileRef}
                type="file"
                accept=".pdf"
                className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-border file:bg-card file:text-sm file:text-foreground file:cursor-pointer hover:file:bg-secondary"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">CNH do Sócio (PDF ou imagem)</Label>
              <input
                ref={cnhFileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-border file:bg-card file:text-sm file:text-foreground file:cursor-pointer hover:file:bg-secondary"
              />
            </div>
          </div>
          <Button
            onClick={handleExtract}
            disabled={extractStatus.type === "loading"}
            variant="outline"
            size="sm"
          >
            {extractStatus.type === "loading" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            Extrair dados
          </Button>
          {extractStatus.type === "success" && (
            <div className="rounded-lg bg-primary/10 px-3 py-2 text-sm space-y-1">
              <p className="text-primary flex items-center gap-1">
                <CheckCircle className="h-4 w-4 shrink-0" />
                {extractStatus.message}
              </p>
              {extractedFields.map((f, i) => (
                <p key={i} className="text-muted-foreground text-xs ml-5">• {f}</p>
              ))}
            </div>
          )}
          {extractStatus.type === "error" && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {extractStatus.message}
            </div>
          )}
          {extractWarnings.length > 0 && (
            <div className="text-xs text-muted-foreground space-y-0.5">
              {extractWarnings.map((w, i) => (
                <p key={i} className="flex items-start gap-1">
                  <AlertCircle className="h-3 w-3 shrink-0 mt-0.5 text-yellow-500" />
                  {w}
                </p>
              ))}
            </div>
          )}
        </section>

        <div className="border-t border-border" />

        {/* Section 1: Dados do Contratante */}
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
              <Label>E-mail que assina</Label>
              <Input
                type="email"
                value={emailAssinante}
                onChange={(e) => setEmailAssinante(e.target.value)}
                placeholder="contratante@empresa.com.br"
              />
            </div>
            <AddressBlock
              label="CEP da empresa"
              cep={cepEmp}
              onCepChange={setCepEmp}
              numero={numEmp}
              onNumeroChange={setNumEmp}
              complemento={complEmp}
              onComplementoChange={setComplEmp}
              cepData={cepEmpData}
              loading={cepEmpLoading}
            />
          </div>
        </section>

        <div className="border-t border-border" />

        {/* Section 2: Sócio */}
        <section>
          <h3 className="text-sm font-semibold mb-3">Dados do Sócio</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do sócio</Label>
              <Input
                value={nomeSocio}
                onChange={(e) => setNomeSocio(e.target.value)}
                placeholder="Ex: João da Silva"
              />
            </div>
            <div className="space-y-2">
              <Label>CPF do sócio</Label>
              <Input
                value={cpfSocio}
                onChange={(e) => setCpfSocio(formatCPF(e.target.value))}
                placeholder="XXX.XXX.XXX-XX"
              />
            </div>
            <AddressBlock
              label="CEP do sócio"
              cep={cepSoc}
              onCepChange={setCepSoc}
              numero={numSoc}
              onNumeroChange={setNumSoc}
              complemento={complSoc}
              onComplementoChange={setComplSoc}
              cepData={cepSocData}
              loading={cepSocLoading}
            />
          </div>
        </section>

        <div className="border-t border-border" />

        {/* Section 3: Empresas Vinculadas */}
        <section>
          <button
            type="button"
            onClick={() => setShowVinculadas(!showVinculadas)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                showVinculadas && "rotate-180",
              )}
            />
            Empresas Vinculadas{" "}
            {vinculadas.length > 0 && (
              <span className="text-primary">({vinculadas.length})</span>
            )}
          </button>
          {showVinculadas && (
            <div className="mt-3 space-y-3">
              {vinculadas.map((v, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <Input
                    className="flex-1"
                    value={v.razao_social}
                    onChange={(e) => {
                      const copy = [...vinculadas];
                      copy[i] = { ...copy[i], razao_social: e.target.value };
                      setVinculadas(copy);
                    }}
                    placeholder="Razão Social"
                  />
                  <Input
                    className="flex-1"
                    value={v.cnpj}
                    onChange={(e) => {
                      const copy = [...vinculadas];
                      copy[i] = {
                        ...copy[i],
                        cnpj: formatCNPJ(e.target.value),
                      };
                      setVinculadas(copy);
                    }}
                    placeholder="CNPJ"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setVinculadas(vinculadas.filter((_, j) => j !== i))
                    }
                    className="shrink-0 mt-2 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setVinculadas([
                    ...vinculadas,
                    { razao_social: "", cnpj: "" },
                  ])
                }
              >
                <Plus className="mr-1 h-3 w-3" /> Adicionar
              </Button>
            </div>
          )}
        </section>

        <div className="border-t border-border" />

        {/* Section 4: Pagamento */}
        <section>
          <h3 className="text-sm font-semibold mb-3">
            Condições de Pagamento
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor do Setup (R$)</Label>
              <Input
                value={vSetup}
                onChange={(e) => setVSetup(formatCurrency(e.target.value))}
                placeholder="Ex: 12.000,00"
              />
            </div>
            <div className="space-y-2">
              <Label>Parcelas do Setup</Label>
              <Input
                type="number"
                min={1}
                max={48}
                value={parcSetup}
                onChange={(e) =>
                  setParcSetup(Math.max(1, Number(e.target.value) || 1))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Forma de pagamento Setup</Label>
              <RadioGroup
                value={formaSetup}
                onValueChange={setFormaSetup}
                className="flex gap-4"
              >
                {[
                  { id: "cartao", label: "Cartão" },
                  { id: "boleto", label: "Boleto" },
                  { id: "pix", label: "PIX" },
                ].map((o) => (
                  <label
                    key={o.id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <RadioGroupItem value={o.id} />
                    <span className="text-sm">{o.label}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
            {parcelaSetup && (
              <div className="flex items-end">
                <span className="text-sm text-muted-foreground">
                  Parcela: <span className="text-foreground font-medium">{parcelaSetup}</span>
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label>Valor mensal (R$)</Label>
              <Input
                value={vMensal}
                onChange={(e) => setVMensal(formatCurrency(e.target.value))}
                placeholder="Ex: 2.500,00"
              />
            </div>
            <div className="space-y-2">
              <Label>Forma de pagamento mensal</Label>
              <RadioGroup
                value={formaMensal}
                onValueChange={setFormaMensal}
                className="flex gap-4"
              >
                {[
                  { id: "cartao", label: "Cartão" },
                  { id: "boleto", label: "Boleto" },
                  { id: "pix", label: "PIX" },
                ].map((o) => (
                  <label
                    key={o.id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <RadioGroupItem value={o.id} />
                    <span className="text-sm">{o.label}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>Início da recorrência (dias)</Label>
              <Input
                type="number"
                min={1}
                max={365}
                value={inicioRec}
                onChange={(e) => setInicioRec(Number(e.target.value) || 90)}
              />
            </div>
            <div className="space-y-2">
              <Label>Aviso prévio (dias)</Label>
              <Input
                type="number"
                min={1}
                max={365}
                value={antecedencia}
                onChange={(e) => setAntecedencia(Number(e.target.value) || 30)}
              />
            </div>
          </div>
        </section>

        <div className="border-t border-border" />

        {/* Actions */}
        <section className="space-y-3">
          {apiOk === false && (
            <div className="flex items-center gap-2 text-sm rounded-lg px-3 py-2 bg-destructive/10 text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              API de contratos indisponível ({API_BASE}). Geração, Slack, Assinatura e Pagamento não funcionarão.
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleGenerate}
              disabled={!isValid || generateStatus.type === "loading" || apiOk === false}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {generateStatus.type === "loading" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Gerar DOCX
            </Button>
            <Button
              onClick={handlePDF}
              disabled={!isValid || pdfStatus.type === "loading" || apiOk === false}
              variant="outline"
            >
              {pdfStatus.type === "loading" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              Gerar PDF
            </Button>
            <Button
              onClick={handleSlack}
              disabled={!contractB64 || slackStatus.type === "loading"}
              variant="outline"
            >
              {slackStatus.type === "loading" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Enviar Slack
            </Button>
            <Button
              onClick={() => setShowAutentique(!showAutentique)}
              disabled={!contractB64}
              variant="outline"
            >
              <PenLine className="mr-2 h-4 w-4" />
              Assinatura
            </Button>
            <Button
              onClick={() => setShowIpag(!showIpag)}
              disabled={apiOk === false}
              variant="outline"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Link Pagamento
            </Button>
          </div>
          {!contractB64 && isValid && (
            <p className="text-xs text-muted-foreground">
              Gere o contrato (DOCX ou PDF) para habilitar Slack e Assinatura.
            </p>
          )}

          {/* Status messages */}
          {[generateStatus, pdfStatus, slackStatus].map((s, i) =>
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

          {/* Autentique panel */}
          {showAutentique && contractB64 && (
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
                <input
                  type="checkbox"
                  checked={autSandbox}
                  onChange={(e) => setAutSandbox(e.target.checked)}
                  className="accent-[var(--color-primary)]"
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
                Enviar
              </Button>
              {autStatus.type === "success" && (
                <div className="text-sm text-primary">
                  <CheckCircle className="inline h-4 w-4 mr-1" />
                  {autStatus.message}
                  {signingLink && (
                    <div className="mt-2 font-mono text-xs bg-primary/10 rounded px-2 py-1 break-all">
                      {signingLink}
                    </div>
                  )}
                </div>
              )}
              {autStatus.type === "error" && (
                <div className="text-sm text-destructive">
                  <AlertCircle className="inline h-4 w-4 mr-1" />
                  {autStatus.message}
                </div>
              )}
            </div>
          )}

          {/* iPag panel */}
          {showIpag && (
            <div className="rounded-xl border border-border bg-background p-4 space-y-3">
              <p className="text-sm font-medium">Link de Pagamento (iPag)</p>
              <div className="grid grid-cols-2 gap-3">
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
                  <Label>Sem juros</Label>
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
              <Button
                onClick={handleIpag}
                disabled={!vSetup.trim() || ipagStatus.type === "loading"}
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {ipagStatus.type === "loading" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-4 w-4" />
                )}
                Gerar Link
              </Button>
              {ipagStatus.type === "success" && paymentLink && (
                <div className="text-sm text-primary">
                  <CheckCircle className="inline h-4 w-4 mr-1" />
                  {ipagStatus.message}
                  <div className="mt-2 font-mono text-xs bg-primary/10 rounded px-2 py-1 break-all">
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
                <div className="text-sm text-destructive">
                  <AlertCircle className="inline h-4 w-4 mr-1" />
                  {ipagStatus.message}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
