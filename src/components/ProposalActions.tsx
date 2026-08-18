"use client";

import { useState } from "react";
import { Eye, FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  downloadProposalHTML,
  fileToDataUrl,
  previewProposalHTML,
  type ClosingOffer,
  type ProposalModel,
} from "@/lib/proposal";
import { formatBRL } from "@/lib/format";

interface Props {
  /** Modelo sem a condição de fechamento — ela é preenchida aqui. */
  buildModel: (closing?: ClosingOffer) => ProposalModel;
  /**
   * Condição já derivada da calculadora — tipicamente o desconto de fechamento
   * selecionado no seletor. Quando presente, a condição vem ligada por padrão e
   * os campos acompanham os parâmetros da calculadora até serem editados.
   */
  suggestedClosing?: ClosingOffer;
  /** Rótulo da origem da sugestão, exibido para o executivo. */
  suggestionLabel?: string;
  /** Parcelas padrão do setup na condição de fechamento. */
  defaultInstallments?: number;
}

/**
 * Bloco de geração da proposta em HTML. A condição especial é opcional: sem
 * preenchê-la, a proposta sai com os valores de tabela ancorados na folha CLT.
 */
export function ProposalActions({
  buildModel,
  suggestedClosing,
  suggestionLabel,
  defaultInstallments = 12,
}: Props) {
  const [clientName, setClientName] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState<string>();
  const [logoName, setLogoName] = useState<string>();
  const [busy, setBusy] = useState<"preview" | "download" | null>(null);

  // null = segue a calculadora; valor = o executivo assumiu o controle do campo.
  const [overrideUse, setOverrideUse] = useState<boolean | null>(null);
  const [manualMonthly, setManualMonthly] = useState<number | null>(null);
  const [manualSetup, setManualSetup] = useState<number | null>(null);
  const [manualInstallments, setManualInstallments] = useState<number | null>(null);

  const useClosing = overrideUse ?? Boolean(suggestedClosing);
  const closingMonthly = manualMonthly ?? suggestedClosing?.monthly ?? 0;
  const closingSetup = manualSetup ?? suggestedClosing?.setupTotal ?? 0;
  const installments = manualInstallments ?? suggestedClosing?.installments ?? defaultInstallments;

  const closing: ClosingOffer | undefined =
    useClosing && closingMonthly > 0
      ? {
          monthly: closingMonthly,
          setupTotal: closingSetup,
          installments,
          note: suggestedClosing?.note,
        }
      : undefined;

  async function handleLogo(file: File | undefined) {
    if (!file) return;
    try {
      setLogoDataUrl(await fileToDataUrl(file));
      setLogoName(file.name);
    } catch {
      toast.error("Não foi possível ler a imagem.");
    }
  }

  /** Nome vindo do diagnóstico, usado como sugestão quando o campo está vazio. */
  const suggestedName = buildModel().client.name;

  function model(): ProposalModel {
    const base = buildModel(closing);
    const name = clientName.trim() || base.client.name;
    return { ...base, client: { ...base.client, name, logoDataUrl } };
  }

  async function run(action: "preview" | "download") {
    setBusy(action);
    try {
      if (action === "preview") await previewProposalHTML(model());
      else await downloadProposalHTML(model());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao gerar a proposta.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-border bg-card p-4 space-y-4">
      <div>
        <p className="text-sm font-semibold">Proposta para o cliente</p>
        <p className="text-xs text-muted-foreground mt-1">
          Documento em HTML com o design da O2, comparativo com a folha CLT e escopo — para enviar
          direto ao cliente.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="proposal-client" className="text-xs">
          Nome do cliente
        </Label>
        <Input
          id="proposal-client"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder={suggestedName}
        />
        <p className="text-xs text-muted-foreground">
          {clientName.trim()
            ? "Aparece na capa, no rodapé e no nome do arquivo."
            : `Em branco, usa "${suggestedName}" — o nome do diagnóstico.`}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="proposal-logo" className="text-xs">
          Logo do cliente (opcional)
        </Label>
        <Input
          id="proposal-logo"
          type="file"
          accept="image/*"
          className="text-xs"
          onChange={(e) => handleLogo(e.target.files?.[0])}
        />
        {logoName && <p className="text-xs text-primary">{logoName}</p>}
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={useClosing}
          onChange={(e) => setOverrideUse(e.target.checked)}
          className="accent-primary h-4 w-4"
        />
        Mostrar condição especial de fechamento
      </label>

      {suggestedClosing && (
        <p className="text-xs text-primary -mt-2">
          {useClosing
            ? `Preenchida por "${suggestionLabel ?? "desconto da calculadora"}". A proposta mostra o valor de tabela riscado.`
            : `Há um desconto ativo ("${suggestionLabel ?? "desconto da calculadora"}") que não vai aparecer como condição especial.`}
        </p>
      )}

      {useClosing && (
        <div className="space-y-3 rounded-md border border-border/70 bg-background/40 p-3">
          <div className="space-y-1">
            <Label htmlFor="closing-monthly" className="text-xs">
              Mensalidade fechada (todos os serviços)
            </Label>
            <Input
              id="closing-monthly"
              type="number"
              min={0}
              step={100}
              value={closingMonthly || ""}
              onChange={(e) => setManualMonthly(Number(e.target.value))}
              placeholder="15000"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="closing-setup" className="text-xs">
                Setup total
              </Label>
              <Input
                id="closing-setup"
                type="number"
                min={0}
                step={500}
                value={closingSetup || ""}
                onChange={(e) => setManualSetup(Number(e.target.value))}
                placeholder="30000"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="closing-installments" className="text-xs">
                Parcelas
              </Label>
              <Input
                id="closing-installments"
                type="number"
                min={1}
                max={24}
                value={installments}
                onChange={(e) => setManualInstallments(Math.max(1, Number(e.target.value)))}
              />
            </div>
          </div>
          {closingSetup > 0 && installments > 0 && (
            <p className="text-xs text-muted-foreground">
              {installments}× de {formatBRL(closingSetup / installments)} · desembolso mensal de{" "}
              {formatBRL(closingMonthly + closingSetup / installments)}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          disabled={busy !== null}
          onClick={() => run("preview")}
          className="bg-card border border-border text-foreground hover:border-primary/60"
        >
          {busy === "preview" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Eye className="mr-2 h-4 w-4" />
          )}
          Visualizar
        </Button>
        <Button
          disabled={busy !== null}
          onClick={() => run("download")}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {busy === "download" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="mr-2 h-4 w-4" />
          )}
          Baixar HTML
        </Button>
      </div>
    </div>
  );
}
