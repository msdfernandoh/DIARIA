import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, Share, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { OnboardingShell } from "../../../src/components/OnboardingShell";
import { EMPREENDEDOR_ONBOARDING_STEPS, REF_LINK_BASE } from "../../../src/constants/empreendedor";
import { useEmpreendedorOnboarding } from "../../../src/context/EmpreendedorOnboardingContext";
import {
  completeEmpreendedorOnboarding,
  generateUniqueEntrepreneurCode,
} from "../../../src/lib/empreendedorOnboarding";
import { supabase } from "../../../src/lib/supabase";
import { colors } from "../../../src/constants/theme";

const ACCENT = colors.amber;

export default function ConclusaoStep() {
  const { draft, setDraft } = useEmpreendedorOnboarding();
  const [saving, setSaving] = useState(false);
  const [codigo, setCodigo] = useState(draft.generatedCodigo);

  useEffect(() => {
    if (codigo) return;
    generateUniqueEntrepreneurCode(draft.nome).then((c) => {
      setCodigo(c);
      setDraft((d) => ({ ...d, generatedCodigo: c }));
    });
  }, [codigo, draft.nome, setDraft]);

  const link = codigo ? `${REF_LINK_BASE}/${codigo}` : "";

  async function finish() {
    setSaving(true);
    try {
      const { data } = await supabase.auth.getUser();
      const id = data.user?.id;
      if (!id) throw new Error("Sessão expirada.");
      const finalCode = await completeEmpreendedorOnboarding(id, {
        ...draft,
        generatedCodigo: codigo,
      });
      setCodigo(finalCode);
      router.replace("/(app)/(empreendedor)/painel");
    } catch (e) {
      Alert.alert("Erro", e instanceof Error ? e.message : "Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <OnboardingShell
      step={6}
      totalSteps={EMPREENDEDOR_ONBOARDING_STEPS}
      accentColor={ACCENT}
      title="Tudo pronto! Seu código está aqui."
      subtitle="Compartilhe para trazer profissionais e empresas."
      onBack={() => router.back()}
      onNext={finish}
      nextLabel={saving ? "Salvando…" : "Ir para meu painel →"}
      nextDisabled={saving || !codigo}
    >
      <View style={styles.codeBox}>
        <Text style={styles.code}>{codigo || "…"}</Text>
      </View>
      <Text style={styles.link}>{link}</Text>
      <View style={styles.actions}>
        <Pressable
          style={styles.btn}
          onPress={() => link && Clipboard.setStringAsync(link)}
        >
          <Text style={styles.btnText}>📋 Copiar link</Text>
        </Pressable>
        <Pressable
          style={styles.btn}
          onPress={() =>
            link &&
            Share.share({ message: `Entre na Diária da Cidade: ${link}`, url: link })
          }
        >
          <Text style={styles.btnText}>📤 Compartilhar</Text>
        </Pressable>
      </View>
      {link ? (
        <View style={styles.qr}>
          <QRCode value={link} size={180} />
        </View>
      ) : null}
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  codeBox: {
    backgroundColor: "rgba(217,119,6,0.15)",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 12,
  },
  code: { fontSize: 32, fontWeight: "800", color: colors.amber, letterSpacing: 2 },
  link: { textAlign: "center", color: colors.soft, fontSize: 12, marginBottom: 12 },
  actions: { flexDirection: "row", gap: 10, justifyContent: "center", marginBottom: 16 },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  btnText: { fontWeight: "700", color: colors.dark, fontSize: 13 },
  qr: { alignItems: "center", marginTop: 8 },
});
