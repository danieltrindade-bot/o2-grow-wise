import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type TrafficLight = "green" | "yellow" | "red" | null;

export interface DiagnosticState {
  companyName: string;
  consultantName: string;
  date: string;
  monthlyRevenue: number;
  companyAge: "" | "less_1" | "1_3" | "3_7" | "more_7";
  growth: "" | "strong" | "moderate" | "stable" | "declining";
  mainChallenge: string;
  meetingMotivation: string;
  answers: Record<string, TrafficLight>;
  overallScore: number;
  currentScreen: 1 | 2 | 3;
}

const STORAGE_KEY = "o2-diagnostic-state";

const todayISO = () => new Date().toISOString().slice(0, 10);

const initialState = (): DiagnosticState => ({
  companyName: "",
  consultantName: "",
  date: todayISO(),
  monthlyRevenue: 0,
  companyAge: "",
  growth: "",
  mainChallenge: "",
  meetingMotivation: "",
  answers: {},
  overallScore: 0,
  currentScreen: 1,
});

function isValid(s: unknown): s is DiagnosticState {
  if (!s || typeof s !== "object") return false;
  const o = s as Record<string, unknown>;
  return (
    typeof o.companyName === "string" &&
    typeof o.consultantName === "string" &&
    typeof o.date === "string" &&
    typeof o.monthlyRevenue === "number" &&
    typeof o.mainChallenge === "string" &&
    typeof o.meetingMotivation === "string" &&
    typeof o.overallScore === "number" &&
    (o.currentScreen === 1 || o.currentScreen === 2 || o.currentScreen === 3) &&
    typeof o.answers === "object" && o.answers !== null
  );
}

interface Ctx {
  state: DiagnosticState;
  setState: (partial: Partial<DiagnosticState>) => void;
  goTo: (screen: 1 | 2 | 3) => void;
  reset: () => void;
}

const DiagnosticContext = createContext<Ctx | null>(null);

export function DiagnosticProvider({ children }: { children: ReactNode }) {
  const [state, setStateRaw] = useState<DiagnosticState>(initialState);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (isValid(parsed)) setStateRaw(parsed);
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const setState = (partial: Partial<DiagnosticState>) =>
    setStateRaw((prev) => ({ ...prev, ...partial }));

  const goTo = (screen: 1 | 2 | 3) => setStateRaw((prev) => ({ ...prev, currentScreen: screen }));

  const reset = () => {
    const fresh = initialState();
    setStateRaw(fresh);
    if (typeof window !== "undefined") sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  };

  return (
    <DiagnosticContext.Provider value={{ state, setState, goTo, reset }}>
      {children}
    </DiagnosticContext.Provider>
  );
}

export function useDiagnostic() {
  const ctx = useContext(DiagnosticContext);
  if (!ctx) throw new Error("useDiagnostic must be used within DiagnosticProvider");
  return ctx;
}
