import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { selectAll, insertRows, updateRow } from "@/lib/local-store";
import { sendLead } from "@/lib/lead-webhook";

export type TrafficLight = "green" | "yellow" | "red" | null;

export interface DiagnosticState {
  companyName: string;
  consultantName: string;
  consultantEmail: string;
  consultantPhone: string;
  date: string;
  monthlyRevenue: number;
  companyAge: "" | "less_1" | "1_3" | "3_7" | "more_7";
  growth: "" | "strong" | "moderate" | "stable" | "declining";
  mainChallenges: string[];
  meetingMotivation: string;
  answers: Record<string, TrafficLight>;
  overallScore: number;
  currentScreen: 1 | 2 | 3;
  meetingId: string | null;
  notes: string;
}

export interface Meeting {
  id: string;
  companyName: string;
  consultantName: string;
  consultantEmail: string;
  consultantPhone: string;
  date: string;
  monthlyRevenue: number;
  companyAge: string;
  growth: string;
  mainChallenges: string[];
  meetingMotivation: string;
  answers: Record<string, TrafficLight>;
  overallScore: number;
  status: "draft" | "completed";
  notes: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "o2-diagnostic-state";
const MEETINGS_TABLE = "meetings";

const todayISO = () => new Date().toISOString().slice(0, 10);

const initialState = (): DiagnosticState => ({
  companyName: "",
  consultantName: "",
  consultantEmail: "",
  consultantPhone: "",
  date: todayISO(),
  monthlyRevenue: 0,
  companyAge: "",
  growth: "",
  mainChallenges: [],
  meetingMotivation: "",
  answers: {},
  overallScore: 0,
  currentScreen: 1,
  meetingId: null,
  notes: "",
});

function isValid(s: unknown): s is DiagnosticState {
  if (!s || typeof s !== "object") return false;
  const o = s as Record<string, unknown>;
  if (
    typeof o.companyName === "string" &&
    typeof o.consultantName === "string" &&
    (typeof o.consultantEmail === "undefined" || typeof o.consultantEmail === "string") &&
    (typeof o.consultantPhone === "undefined" || typeof o.consultantPhone === "string") &&
    typeof o.date === "string" &&
    typeof o.monthlyRevenue === "number" &&
    typeof o.meetingMotivation === "string" &&
    typeof o.overallScore === "number" &&
    (o.currentScreen === 1 || o.currentScreen === 2 || o.currentScreen === 3) &&
    typeof o.answers === "object" && o.answers !== null
  ) {
    if (typeof o.mainChallenge === "string" && !Array.isArray(o.mainChallenges)) {
      (o as any).mainChallenges = o.mainChallenge ? [o.mainChallenge as string] : [];
      delete (o as any).mainChallenge;
    }
    if (!Array.isArray(o.mainChallenges)) (o as any).mainChallenges = [];
    return true;
  }
  return false;
}

function stateToMeeting(state: DiagnosticState, status: "draft" | "completed"): Omit<Meeting, "id" | "createdAt"> {
  return {
    companyName: state.companyName,
    consultantName: state.consultantName,
    consultantEmail: state.consultantEmail,
    consultantPhone: state.consultantPhone,
    date: state.date,
    monthlyRevenue: state.monthlyRevenue,
    companyAge: state.companyAge,
    growth: state.growth,
    mainChallenges: state.mainChallenges,
    meetingMotivation: state.meetingMotivation,
    answers: state.answers,
    overallScore: state.overallScore,
    status,
    notes: state.notes,
    updatedAt: new Date().toISOString(),
  };
}

interface Ctx {
  state: DiagnosticState;
  setState: (partial: Partial<DiagnosticState>) => void;
  goTo: (screen: 1 | 2 | 3) => void;
  reset: () => void;
  saveMeeting: (status: "draft" | "completed", overrides?: Partial<DiagnosticState>) => string;
  loadMeeting: (meeting: Meeting) => void;
}

const DiagnosticContext = createContext<Ctx | null>(null);

export function DiagnosticProvider({ children }: { children: ReactNode }) {
  const [state, setStateRaw] = useState<DiagnosticState>(initialState);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (isValid(parsed)) {
        setStateRaw({ ...initialState(), ...parsed });
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const setState = (partial: Partial<DiagnosticState>) =>
    setStateRaw((prev) => ({ ...prev, ...partial }));

  const goTo = (screen: 1 | 2 | 3) => setStateRaw((prev) => ({ ...prev, currentScreen: screen }));

  const reset = () => {
    const fresh = initialState();
    setStateRaw(fresh);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  };

  const saveMeeting = useCallback((status: "draft" | "completed", overrides?: Partial<DiagnosticState>): string => {
    const now = new Date().toISOString();
    const effective = overrides ? { ...state, ...overrides } : state;
    const data = stateToMeeting(effective, status);

    if (effective.meetingId) {
      const existing = selectAll<Meeting>(MEETINGS_TABLE).find((m) => m.id === effective.meetingId);
      if (existing) {
        updateRow(MEETINGS_TABLE, effective.meetingId, data);
        sendLead({ ...data, id: effective.meetingId });
        return effective.meetingId;
      }
    }

    const id = crypto.randomUUID();
    insertRows(MEETINGS_TABLE, [{ ...data, id, createdAt: now }]);
    setStateRaw((prev) => ({ ...prev, meetingId: id }));
    sendLead({ ...data, id, createdAt: now });
    return id;
  }, [state]);

  const loadMeeting = useCallback((meeting: Meeting) => {
    const loaded: DiagnosticState = {
      companyName: meeting.companyName,
      consultantName: meeting.consultantName,
      consultantEmail: meeting.consultantEmail || "",
      consultantPhone: meeting.consultantPhone || "",
      date: meeting.date,
      monthlyRevenue: meeting.monthlyRevenue,
      companyAge: (meeting.companyAge || "") as DiagnosticState["companyAge"],
      growth: (meeting.growth || "") as DiagnosticState["growth"],
      mainChallenges: Array.isArray(meeting.mainChallenges)
        ? meeting.mainChallenges
        : (meeting as any).mainChallenge
          ? [(meeting as any).mainChallenge]
          : [],
      meetingMotivation: meeting.meetingMotivation,
      answers: meeting.answers,
      overallScore: meeting.overallScore,
      currentScreen: meeting.status === "completed" ? 3 : 1,
      meetingId: meeting.id,
      notes: meeting.notes || "",
    };
    setStateRaw(loaded);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(loaded));
  }, []);

  return (
    <DiagnosticContext.Provider value={{ state, setState, goTo, reset, saveMeeting, loadMeeting }}>
      {children}
    </DiagnosticContext.Provider>
  );
}

export function useDiagnostic() {
  const ctx = useContext(DiagnosticContext);
  if (!ctx) throw new Error("useDiagnostic must be used within DiagnosticProvider");
  return ctx;
}
