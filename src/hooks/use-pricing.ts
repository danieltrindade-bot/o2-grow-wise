import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const FIVE_MIN = 5 * 60 * 1000;

async function selectAll<T = any>(table: string, orderBy?: string): Promise<T[]> {
  const q = supabase.from(table as any).select("*");
  const { data, error } = orderBy ? await q.order(orderBy as any) : await q;
  if (error) throw error;
  return (data ?? []) as T[];
}

export interface BPOPackage {
  id: string;
  name: string;
  description: string | null;
  price_tier_1: number;
  price_tier_2: number;
  price_tier_3: number;
  display_order: number;
}
export interface BPOSetupModule {
  id: string;
  name: string;
  installments: number;
  installment_value: number;
  add_to_monthly: boolean;
  is_mandatory: boolean;
  is_active: boolean;
}
export interface BPOSettings {
  dias_uteis: number;
  markup_percent: number;
  tier_1_limit: number;
  tier_2_limit: number;
}

export function useBPOPricing() {
  return useQuery({
    queryKey: ["bpo-pricing"],
    staleTime: FIVE_MIN,
    queryFn: async () => {
      const [packages, setupRows, settingsRows] = await Promise.all([
        selectAll<BPOPackage>("bpo_packages", "display_order"),
        selectAll<BPOSetupModule>("bpo_setup_module"),
        selectAll<{ key: string; value: any }>("bpo_settings"),
      ]);
      const settings: BPOSettings = {
        dias_uteis: 22,
        markup_percent: 20,
        tier_1_limit: 200,
        tier_2_limit: 500,
      };
      for (const r of settingsRows) {
        const v = typeof r.value === "number" ? r.value : Number(r.value);
        if (r.key in settings) (settings as any)[r.key] = v;
      }
      const setup = setupRows.find((s) => s.is_active) ?? setupRows[0];
      return { packages, setup, settings };
    },
  });
}

export interface CFOBaseRule {
  id: string;
  label: string;
  min_revenue: number;
  max_revenue: number | null;
  base_price: number;
  sort_order: number;
}
export interface CFOCnpjRule {
  cnpj_count: number;
  multiplier: number;
}
export interface CFOComplexityRule {
  level: string;
  min_score: number;
  max_score: number;
  factor: number;
}
export interface CFOSegmentRule {
  segment_type: string;
  adjustment: number;
}
export interface CFOGovernanceRule {
  governance_type: string;
  fee: number;
}
export interface SetupPricingRule {
  id: string;
  label: string;
  min_revenue: number;
  max_revenue: number | null;
  price_standard: number;
  price_complex: number;
  sort_order: number;
}

export function useCFOPricing() {
  return useQuery({
    queryKey: ["cfo-pricing"],
    staleTime: FIVE_MIN,
    queryFn: async () => {
      const [base, cnpj, complexity, segment, governance, setup] = await Promise.all([
        selectAll<CFOBaseRule>("cfo_base_rules", "sort_order"),
        selectAll<CFOCnpjRule>("cfo_cnpj_rules", "cnpj_count"),
        selectAll<CFOComplexityRule>("cfo_complexity_rules", "min_score"),
        selectAll<CFOSegmentRule>("cfo_segment_rules"),
        selectAll<CFOGovernanceRule>("cfo_governance_rules"),
        selectAll<SetupPricingRule>("setup_pricing_rules", "sort_order"),
      ]);
      return { base, cnpj, complexity, segment, governance, setup };
    },
  });
}

export function useSetupPricing() {
  return useQuery({
    queryKey: ["setup-pricing"],
    staleTime: FIVE_MIN,
    queryFn: () => selectAll<SetupPricingRule>("setup_pricing_rules", "sort_order"),
  });
}

// Oxy + Gênio and Coordenador share setup pricing rules
export const useOxyPricing = useSetupPricing;
export const useCoordenadorPricing = useSetupPricing;

export interface AssessoriaRule {
  id: string;
  label: string;
  min_revenue: number;
  max_revenue: number | null;
  base_price: number;
  sort_order: number;
}
export interface AssessoriaSettings {
  id: string;
  cnpj_adjustment: number;
  min_price: number;
  max_price: number;
}

export function useAssessoriaPricing() {
  return useQuery({
    queryKey: ["assessoria-pricing"],
    staleTime: FIVE_MIN,
    queryFn: async () => {
      const [rules, settingsArr] = await Promise.all([
        selectAll<AssessoriaRule>("assessoria_pricing_rules", "sort_order"),
        selectAll<AssessoriaSettings>("assessoria_settings"),
      ]);
      const settings = settingsArr[0] ?? {
        id: "",
        cnpj_adjustment: 500,
        min_price: 4170,
        max_price: 8570,
      };
      return { rules, settings };
    },
  });
}

// Diagnostic config
export interface DiagnosticQuestion {
  id: string;
  dimension: string;
  question_key: string;
  question_text: string;
  option_green: string;
  option_yellow: string;
  option_red: string;
  global_order: number;
}
export interface CostParameter {
  id: string;
  dimension: string;
  question_key: string;
  label: string;
  trigger_color: "green" | "yellow" | "red";
  pct_min: number | null;
  pct_max: number | null;
  qualitative: boolean;
}
export interface MaturityLevel {
  id: string;
  level_key: string;
  label: string;
  description: string;
  color: string;
  score_min: number;
  score_max: number;
  sort_order: number;
}
export interface OutcomeText {
  id: string;
  dimension: string;
  question_key: string;
  current_text: string;
  future_text: string;
  check_red: boolean;
}
export interface ProductRecommendation {
  id: string;
  rule_key: string;
  name: string;
  tagline: string;
  price: number | null;
  score_min: number;
  score_max: number;
}

export function useDiagnosticConfig() {
  return useQuery({
    queryKey: ["diagnostic-config"],
    staleTime: FIVE_MIN,
    queryFn: async () => {
      const [questions, costs, maturity, outcomes, recommendations] = await Promise.all([
        selectAll<DiagnosticQuestion>("diagnostic_questions", "global_order"),
        selectAll<CostParameter>("cost_parameters"),
        selectAll<MaturityLevel>("maturity_levels", "sort_order"),
        selectAll<OutcomeText>("outcome_texts"),
        selectAll<ProductRecommendation>("product_recommendations", "score_min"),
      ]);
      return { questions, costs, maturity, outcomes, recommendations };
    },
  });
}
