import { useCallback, useState } from "react";
import { buscarCep, formatCep, type ViaCepResult } from "../lib/viacep";

export function useViaCep() {
  const [cep, setCepRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ViaCepResult | null>(null);

  const setCep = useCallback((value: string) => {
    setCepRaw(formatCep(value));
    setError("");
  }, []);

  const lookup = useCallback(async () => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return null;
    setLoading(true);
    setError("");
    try {
      const r = await buscarCep(digits);
      if (!r) {
        setError("CEP não encontrado.");
        setResult(null);
        return null;
      }
      setResult({ ...r, cep: formatCep(digits) });
      return r;
    } finally {
      setLoading(false);
    }
  }, [cep]);

  return { cep, setCep, lookup, loading, error, result, setError };
}
