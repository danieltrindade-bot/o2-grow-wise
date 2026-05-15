import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function InfoTooltip({ text }: { text: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Mais informações"
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs">{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export const TOOLTIPS = {
  complexidade:
    "Pontue cada dimensão de 1 (baixa) a 3 (alta). O score total define o fator de complexidade aplicado ao preço base.",
  segmento:
    "Mesmo segmento: empresas com a mesma operação. Correlato/Diferente/Muito diferente: aumentam a complexidade da implantação e ajustam o preço.",
  cnpj: "Quantidade de CNPJs/empresas atendidas pelo serviço. Cada CNPJ adicional aumenta o esforço de operação.",
  governanca:
    "Simples: governança consolidada. Gerencial: relatórios separados por unidade. Multiempresa: consolidação contábil de múltiplas empresas.",
} as const;
