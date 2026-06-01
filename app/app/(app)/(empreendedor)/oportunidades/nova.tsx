import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors } from "../../../../src/constants/theme";
import { createPhysicalOpportunity } from "../../../../src/lib/opportunities";
import { buscarCep } from "../../../../src/lib/viacep";
import { supabase } from "../../../../src/lib/supabase";

const TIPOS = [
  { id: "chop", label: "🍺 Chop" },
  { id: "hamburguer", label: "🍔 Hambúrguer" },
  { id: "pizza", label: "🍕 Pizza" },
  { id: "ingresso", label: "🎟️ Ingresso" },
  { id: "servico", label: "💈 Serviço" },
  { id: "outro", label: "🎁 Outro" },
];

export default function NovaOportunidadeScreen() {
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("chop");
  const [custo, setCusto] = useState("80");
  const [qtd, setQtd] = useState("10");
  const [localNome, setLocalNome] = useState("");
  const [cep, setCep] = useState("");
  const [escopo, setEscopo] = useState<"grupo" | "cidade">("grupo");
  const [validadeDias, setValidadeDias] = useState("7");
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  async function onSave() {
    if (!titulo.trim() || !localNome.trim()) {
      Alert.alert("Dados", "Informe título e nome do local.");
      return;
    }
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Sessão expirada.");

      let cidade = "";
      let estado = "";
      let endereco = "";
      if (cep.replace(/\D/g, "").length === 8) {
        setCepLoading(true);
        const addr = await buscarCep(cep.replace(/\D/g, ""));
        setCepLoading(false);
        if (addr) {
          cidade = addr.localidade;
          estado = addr.uf;
          endereco = `${addr.logradouro}, ${addr.bairro}`;
        }
      } else {
        const { data: me } = await supabase.from("users").select("cidade, estado").eq("id", uid).maybeSingle();
        cidade = me?.cidade ?? "Sinop";
        estado = me?.estado ?? "MT";
      }

      const dias = Math.max(1, parseInt(validadeDias, 10) || 7);
      const valida_ate = new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString();

      await createPhysicalOpportunity(uid, {
        titulo,
        tipo,
        custo_moedas: Math.max(1, parseInt(custo, 10) || 80),
        quantidade_total: Math.max(1, parseInt(qtd, 10) || 1),
        valida_ate,
        local_nome: localNome,
        local_endereco: endereco || undefined,
        cidade,
        estado,
        cep,
        escopo,
      });

      Alert.alert("Criada!", "Oportunidade publicada para seu grupo ou cidade.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert("Erro", e instanceof Error ? e.message : "Não foi possível criar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text style={styles.head}>Nova oportunidade física</Text>
      <Text style={styles.hint}>
        Parceiros locais podem validar o QR. Pagamento/comissão Pix pode ser integrado depois.
      </Text>

      <Text style={styles.label}>Título</Text>
      <TextInput style={styles.input} value={titulo} onChangeText={setTitulo} placeholder="Ex: 1 Chop Long Neck" />

      <Text style={styles.label}>Tipo</Text>
      <View style={styles.chips}>
        {TIPOS.map((t) => (
          <Pressable
            key={t.id}
            style={[styles.chip, tipo === t.id && styles.chipOn]}
            onPress={() => setTipo(t.id)}
          >
            <Text style={[styles.chipText, tipo === t.id && styles.chipTextOn]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Custo (moedas)</Text>
      <TextInput style={styles.input} value={custo} onChangeText={setCusto} keyboardType="number-pad" />

      <Text style={styles.label}>Quantidade</Text>
      <TextInput style={styles.input} value={qtd} onChangeText={setQtd} keyboardType="number-pad" />

      <Text style={styles.label}>Validade (dias)</Text>
      <TextInput style={styles.input} value={validadeDias} onChangeText={setValidadeDias} keyboardType="number-pad" />

      <Text style={styles.label}>Local (nome)</Text>
      <TextInput style={styles.input} value={localNome} onChangeText={setLocalNome} placeholder="Bar Parceiro" />

      <Text style={styles.label}>CEP do local (opcional)</Text>
      <TextInput style={styles.input} value={cep} onChangeText={setCep} keyboardType="number-pad" />
      {cepLoading ? <Text style={styles.cepLoad}>Buscando endereço...</Text> : null}

      <Text style={styles.label}>Escopo</Text>
      <View style={styles.row}>
        <Pressable style={[styles.scope, escopo === "grupo" && styles.scopeOn]} onPress={() => setEscopo("grupo")}>
          <Text style={escopo === "grupo" ? styles.scopeOnText : styles.scopeText}>Meu grupo</Text>
        </Pressable>
        <Pressable style={[styles.scope, escopo === "cidade" && styles.scopeOn]} onPress={() => setEscopo("cidade")}>
          <Text style={escopo === "cidade" ? styles.scopeOnText : styles.scopeText}>Toda a cidade</Text>
        </Pressable>
      </View>

      <Pressable style={styles.save} onPress={() => void onSave()} disabled={saving}>
        <Text style={styles.saveText}>{saving ? "Salvando..." : "Publicar oportunidade"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  head: { fontSize: 22, fontWeight: "800", color: colors.dark },
  hint: { color: colors.soft, marginTop: 8, marginBottom: 20, lineHeight: 20 },
  label: { fontWeight: "700", color: colors.mid, marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.white,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  chipOn: { borderColor: colors.amber, backgroundColor: "#FFFBEB" },
  chipText: { fontSize: 12, color: colors.mid },
  chipTextOn: { fontWeight: "800", color: colors.amber },
  cepLoad: { fontSize: 11, color: colors.soft, marginTop: 4 },
  row: { flexDirection: "row", gap: 10 },
  scope: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    backgroundColor: colors.white,
  },
  scopeOn: { borderColor: colors.amber, backgroundColor: "#FFFBEB" },
  scopeText: { color: colors.mid },
  scopeOnText: { fontWeight: "800", color: colors.amber },
  save: {
    marginTop: 28,
    backgroundColor: colors.amber,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
