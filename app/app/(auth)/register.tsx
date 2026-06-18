import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors } from "../../src/constants/theme";
import { resolveAppRoute } from "../../src/lib/authRouting";
import { registerEmpregado } from "../../src/lib/empregadoAuth";
import {
  supabase,
  upsertUserProfile,
  type UserTipo,
} from "../../src/lib/supabase";

export default function Register() {
  const { tipo: tipoParam } = useLocalSearchParams<{ tipo?: string }>();
  const tipo = (tipoParam ?? "empregado") as UserTipo;

  const [nome, setNome] = useState("");
  const [celular, setCelular] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [aceite, setAceite] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onRegisterEmpregado() {
    const outcome = await registerEmpregado({
      nome: nome.trim(),
      celular,
      email: email.trim(),
      senha,
    });

    switch (outcome.type) {
      case "created":
      case "resume_onboarding":
      case "auth_without_profile":
        router.replace(outcome.route as never);
        break;
      case "already_complete":
        Alert.alert("Conta existente", outcome.message, [
          { text: "Continuar", onPress: () => router.replace(outcome.route as never) },
        ]);
        break;
      case "email_not_confirmed":
        Alert.alert("Confirme seu e-mail", outcome.message);
        break;
      case "wrong_password":
        Alert.alert("E-mail já cadastrado", outcome.message, [
          { text: "Ir para entrar", onPress: () => router.replace("/(auth)/login") },
        ]);
        break;
      case "profile_type_conflict":
        Alert.alert("E-mail em outro perfil", outcome.message);
        break;
      case "error":
        Alert.alert("Erro", outcome.message);
        break;
      default:
        Alert.alert("Erro", "Não foi possível concluir o cadastro.");
    }
  }

  async function onRegisterLegacy() {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      options: {
        data: { nome: nome.trim(), celular, tipo, email: email.trim() },
      },
    });
    if (error) {
      Alert.alert("Erro", error.message);
      return;
    }
    const userId = data.user?.id;
    if (!userId) {
      Alert.alert("Erro", "Não foi possível criar a conta.");
      return;
    }
    await upsertUserProfile({
      id: userId,
      nome: nome.trim(),
      celular,
      email: email.trim(),
      tipo,
    });
    const next = await resolveAppRoute(userId);
    router.replace(next);
  }

  async function onRegister() {
    if (!nome.trim() || celular.replace(/\D/g, "").length < 10) {
      Alert.alert("Dados incompletos", "Informe nome e celular válidos.");
      return;
    }
    if (senha.length < 8 || !/\d/.test(senha)) {
      Alert.alert("Senha fraca", "Use pelo menos 8 caracteres e 1 número.");
      return;
    }
    if (!aceite) {
      Alert.alert("Termos", "Aceite os termos para continuar.");
      return;
    }
    if (!email.trim()) {
      Alert.alert("E-mail", "Informe um e-mail para login (obrigatório no MVP).");
      return;
    }

    setLoading(true);
    try {
      if (tipo === "empregado") {
        await onRegisterEmpregado();
      } else {
        await onRegisterLegacy();
      }
    } catch (e) {
      Alert.alert("Perfil", e instanceof Error ? e.message : "Erro ao salvar perfil.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.badge}>Perfil: {tipo}</Text>
      <Text style={styles.label}>Nome completo</Text>
      <TextInput style={styles.input} value={nome} onChangeText={setNome} />
      <Text style={styles.label}>Celular (WhatsApp)</Text>
      <TextInput
        style={styles.input}
        keyboardType="phone-pad"
        value={celular}
        onChangeText={setCelular}
      />
      <Text style={styles.label}>E-mail (login)</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Text style={styles.label}>Senha</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={senha}
        onChangeText={setSenha}
      />
      <View style={styles.row}>
        <Switch value={aceite} onValueChange={setAceite} />
        <Text style={styles.terms}>Li e aceito os Termos de Uso e Privacidade</Text>
      </View>
      <Pressable style={styles.btn} onPress={onRegister} disabled={loading}>
        <Text style={styles.btnText}>{loading ? "Criando…" : "Criar conta grátis"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, gap: 8 },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.primary + "18",
    color: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontWeight: "700",
    fontSize: 12,
    marginBottom: 8,
  },
  label: { fontSize: 12, fontWeight: "700", color: colors.soft, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.white,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 },
  terms: { flex: 1, color: colors.mid, fontSize: 13 },
  btn: {
    marginTop: 12,
    backgroundColor: colors.green,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "800" },
});
