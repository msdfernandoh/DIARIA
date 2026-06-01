import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  defaultEmpreendedorDraft,
  type EmpreendedorOnboardingDraft,
} from "../lib/empreendedorOnboarding";

type Ctx = {
  draft: EmpreendedorOnboardingDraft;
  setDraft: React.Dispatch<React.SetStateAction<EmpreendedorOnboardingDraft>>;
};

const EmpreendedorOnboardingContext = createContext<Ctx | null>(null);

export function EmpreendedorOnboardingProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState(defaultEmpreendedorDraft);
  const value = useMemo(() => ({ draft, setDraft }), [draft]);
  return (
    <EmpreendedorOnboardingContext.Provider value={value}>
      {children}
    </EmpreendedorOnboardingContext.Provider>
  );
}

export function useEmpreendedorOnboarding() {
  const ctx = useContext(EmpreendedorOnboardingContext);
  if (!ctx) throw new Error("useEmpreendedorOnboarding fora do provider");
  return ctx;
}
