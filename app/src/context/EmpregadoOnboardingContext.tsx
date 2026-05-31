import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  defaultDraft,
  type EmpregadoOnboardingDraft,
} from "../lib/empregadoOnboarding";

type Ctx = {
  draft: EmpregadoOnboardingDraft;
  setDraft: React.Dispatch<React.SetStateAction<EmpregadoOnboardingDraft>>;
  step: number;
  setStep: (n: number) => void;
};

const EmpregadoOnboardingContext = createContext<Ctx | null>(null);

export function EmpregadoOnboardingProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState(defaultDraft);
  const [step, setStep] = useState(1);
  const value = useMemo(() => ({ draft, setDraft, step, setStep }), [draft, step]);
  return (
    <EmpregadoOnboardingContext.Provider value={value}>
      {children}
    </EmpregadoOnboardingContext.Provider>
  );
}

export function useEmpregadoOnboarding() {
  const ctx = useContext(EmpregadoOnboardingContext);
  if (!ctx) throw new Error("useEmpregadoOnboarding fora do provider");
  return ctx;
}
