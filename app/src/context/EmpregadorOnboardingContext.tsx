import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  defaultEmpregadorDraft,
  type EmpregadorOnboardingDraft,
} from "../lib/empregadorOnboarding";

type Ctx = {
  draft: EmpregadorOnboardingDraft;
  setDraft: React.Dispatch<React.SetStateAction<EmpregadorOnboardingDraft>>;
  step: number;
  setStep: (n: number) => void;
};

const EmpregadorOnboardingContext = createContext<Ctx | null>(null);

export function EmpregadorOnboardingProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState(defaultEmpregadorDraft);
  const [step, setStep] = useState(1);
  const value = useMemo(() => ({ draft, setDraft, step, setStep }), [draft, step]);
  return (
    <EmpregadorOnboardingContext.Provider value={value}>
      {children}
    </EmpregadorOnboardingContext.Provider>
  );
}

export function useEmpregadorOnboarding() {
  const ctx = useContext(EmpregadorOnboardingContext);
  if (!ctx) throw new Error("useEmpregadorOnboarding fora do provider");
  return ctx;
}
