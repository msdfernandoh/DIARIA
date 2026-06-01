import { Calendar, LocaleConfig } from "react-native-calendars";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { ChipSelect } from "../../../src/components/ChipSelect";
import { JobCard } from "../../../src/components/JobCard";
import { OnboardingShell } from "../../../src/components/OnboardingShell";
import {
  BENEFICIOS_PUBLISH,
  CARGA_OPTIONS,
  CONTRATO_OPTIONS,
  JOB_CATEGORIES,
  PRICE_HINTS,
  PUBLISH_STEPS,
  WEEKDAYS,
} from "../../../src/constants/publishJob";
import { colors } from "../../../src/constants/theme";
import { useViaCep } from "../../../src/hooks/useViaCep";
import { jobDurationLabel, staticMapUrl } from "../../../src/lib/jobFormat";
import {
  buildPreviewJob,
  publishJob,
  type CargaTipo,
  type ContratoTipo,
  type JobFormato,
  type JobTipo,
  type PublishJobInput,
} from "../../../src/lib/publishJob";
import { supabase } from "../../../src/lib/supabase";

LocaleConfig.locales.pt = {
  monthNames: [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ],
  monthNamesShort: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
  dayNames: ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"],
  dayNamesShort: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
  today: "Hoje",
};
LocaleConfig.defaultLocale = "pt";

const ACCENT = colors.primary;

const initialDraft = (): PublishJobInput => ({
  titulo: "",
  categoria: "",
  tipo: "diaria",
  formato: "presencial",
  vagasTotal: 1,
  valor: 0,
  descricao: "",
  requisitos: "",
  beneficios: [],
  urgente: false,
  datasDiaria: [],
  horarioInicio: "08:00",
  horarioFim: "17:00",
  recorrente: false,
  diasRecorrencia: [],
  recorrenciaAte: null,
  dataInicio: null,
  contrato: null,
  carga: null,
  salarioMensal: null,
  aceitaQualquerCidade: true,
  cep: null,
  cidade: null,
  estado: null,
  endereco: null,
  lat: null,
  lng: null,
  referencia: null,
});

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function parseNum(v: string): number {
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function recurrencePreview(dias: number[], ate: string | null): string {
  if (!dias.length) return "Selecione os dias da semana.";
  const names = WEEKDAYS.filter((w) => dias.includes(w.id)).map((w) => w.label);
  const ateLabel = ate
    ? new Date(`${ate}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    : "—";
  return `Toda ${names.join(" e ")} até ${ateLabel}`;
}

function RadioRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.radioRow}>
      <View style={[styles.radioOuter, selected && { borderColor: ACCENT }]}>
        {selected ? <View style={[styles.radioInner, { backgroundColor: ACCENT }]} /> : null}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </Pressable>
  );
}

export default function PublicarVagaScreen() {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<PublishJobInput>(initialDraft);
  const [userId, setUserId] = useState<string | null>(null);
  const [empregadorNome, setEmpregadorNome] = useState("Você");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [publishing, setPublishing] = useState(false);
  const cepHook = useViaCep();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id;
      if (!uid) return;
      setUserId(uid);
      const { data: me } = await supabase
        .from("users")
        .select("nome, cidade, estado, cep")
        .eq("id", uid)
        .maybeSingle();
      if (me?.nome) setEmpregadorNome(me.nome);
      setDraft((d) => ({
        ...d,
        cidade: d.cidade ?? me?.cidade ?? null,
        estado: d.estado ?? me?.estado ?? null,
        cep: d.cep ?? me?.cep ?? null,
      }));
    });
  }, []);

  const markedDates = useMemo(() => {
    const out: Record<string, { selected: boolean; selectedColor: string }> = {};
    draft.datasDiaria.forEach((d) => {
      out[d] = { selected: true, selectedColor: ACCENT };
    });
    return out;
  }, [draft.datasDiaria]);

  const priceHint = PRICE_HINTS[draft.categoria] ?? "Consulte valores da região";

  function toggleDate(date: string) {
    setDraft((d) => {
      const set = new Set(d.datasDiaria);
      if (set.has(date)) set.delete(date);
      else set.add(date);
      return { ...d, datasDiaria: [...set].sort() };
    });
  }

  function toggleWeekday(id: number) {
    setDraft((d) => {
      const set = new Set(d.diasRecorrencia);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return { ...d, diasRecorrencia: [...set].sort() };
    });
  }

  async function syncCepToDraft() {
    const r = await cepHook.lookup();
    if (!r) return;
    const fullEnd = r.logradouro;
    setDraft((d) => ({
      ...d,
      cep: r.cep,
      cidade: r.cidade,
      estado: r.estado,
      endereco: [fullEnd, numero, complemento].filter(Boolean).join(", ") || fullEnd,
    }));
    const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;
    if (key && r.cidade) {
      try {
        const q = encodeURIComponent(`${fullEnd}, ${r.cidade}, ${r.estado}`);
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${q}&key=${key}&region=br`
        );
        const json = await res.json();
        const loc = json.results?.[0]?.geometry?.location;
        if (loc) setDraft((d) => ({ ...d, lat: loc.lat, lng: loc.lng }));
      } catch {
        /* ignore */
      }
    }
  }

  useEffect(() => {
    if (!cepHook.result) return;
    setDraft((d) => ({
      ...d,
      endereco: [cepHook.result!.logradouro, numero, complemento].filter(Boolean).join(", "),
    }));
  }, [numero, complemento, cepHook.result]);

  function validateStep(s: number): string | null {
    if (s === 1) {
      if (!draft.titulo.trim()) return "Informe o título.";
      if (!draft.categoria) return "Escolha uma categoria.";
      if (draft.vagasTotal < 1) return "Quantidade de vagas inválida.";
      if (draft.tipo === "diaria" && draft.valor <= 0) return "Informe o valor da diária.";
    }
    if (s === 2) {
      if (draft.tipo === "diaria") {
        if (!draft.datasDiaria.length) return "Selecione ao menos uma data.";
        if (!draft.horarioInicio || !draft.horarioFim) return "Informe horário início e fim.";
        if (draft.recorrente) {
          if (!draft.diasRecorrencia.length) return "Selecione dias da recorrência.";
          if (!draft.recorrenciaAte) return "Informe até quando repetir.";
        }
      } else {
        if (!draft.dataInicio) return "Informe a data de início.";
        if (!draft.contrato) return "Selecione o tipo de contrato.";
        if (!draft.carga) return "Selecione a carga horária.";
        if (draft.tipo === "emprego_fixo" && (!draft.salarioMensal || draft.salarioMensal <= 0)) {
          return "Informe o salário mensal.";
        }
      }
    }
    if (s === 3) {
      if (!draft.descricao.trim()) return "Descreva a vaga.";
      const needsAddress = draft.formato === "presencial" || draft.formato === "hibrido";
      if (needsAddress) {
        if (!draft.cep || draft.cep.replace(/\D/g, "").length !== 8) return "CEP obrigatório.";
        if (!draft.cidade || !draft.endereco) return "Complete o endereço (CEP válido).";
        if (!numero.trim()) return "Informe o número.";
      }
    }
    return null;
  }

  function next() {
    const err = validateStep(step);
    if (err) {
      Alert.alert("Revise os campos", err);
      return;
    }
    if (step < PUBLISH_STEPS) setStep(step + 1);
  }

  async function onPublish() {
    const err = validateStep(3);
    if (err) {
      Alert.alert("Revise os campos", err);
      return;
    }
    if (!userId) return;
    setPublishing(true);
    try {
      const payload: PublishJobInput = {
        ...draft,
        endereco:
          draft.formato === "presencial" || draft.formato === "hibrido"
            ? [cepHook.result?.logradouro ?? draft.endereco, numero, complemento]
                .filter(Boolean)
                .join(", ")
            : draft.endereco,
        cep: cepHook.cep || draft.cep,
      };
      await publishJob(payload, userId);
      router.replace({
        pathname: "/(app)/(empregador)/painel",
        params: { toast: "published" },
      });
    } catch (e) {
      Alert.alert("Erro", e instanceof Error ? e.message : "Não foi possível publicar.");
    } finally {
      setPublishing(false);
    }
  }

  const previewJob = userId ? buildPreviewJob(draft, userId, empregadorNome) : null;
  const mapUrl =
    draft.lat != null && draft.lng != null ? staticMapUrl(draft.lat, draft.lng, 400, 160) : null;

  const shellProps = {
    step,
    totalSteps: PUBLISH_STEPS,
    accentColor: ACCENT,
    onBack: step > 1 ? () => setStep(step - 1) : undefined,
    onNext: step < 4 ? next : onPublish,
    nextLabel: step === 4 ? (publishing ? "Publicando…" : "Publicar vaga grátis 🚀") : "Continuar",
    nextDisabled: publishing,
  };

  return (
    <View style={styles.screen}>
      {step === 1 ? (
        <OnboardingShell {...shellProps} title="Informações básicas" subtitle="Quem vê a vaga entende o serviço e o valor.">
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Título *</Text>
            <TextInput
              style={styles.input}
              maxLength={80}
              value={draft.titulo}
              onChangeText={(titulo) => setDraft((d) => ({ ...d, titulo }))}
              placeholder="Ex.: Diarista para limpeza pesada"
            />
            <Text style={styles.counter}>{draft.titulo.length}/80</Text>

            <Text style={styles.label}>Categoria *</Text>
            <View style={styles.catGrid}>
              {JOB_CATEGORIES.map((c) => {
                const on = draft.categoria === c.id;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setDraft((d) => ({ ...d, categoria: c.id }))}
                    style={[styles.catChip, on && styles.catChipOn]}
                  >
                    <Text style={[styles.catText, on && styles.catTextOn]} numberOfLines={2}>
                      {c.emoji} {c.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>Tipo *</Text>
            <RadioRow
              label="Diária (data específica)"
              selected={draft.tipo === "diaria"}
              onPress={() => setDraft((d) => ({ ...d, tipo: "diaria" as JobTipo }))}
            />
            <RadioRow
              label="Emprego fixo"
              selected={draft.tipo === "emprego_fixo"}
              onPress={() => setDraft((d) => ({ ...d, tipo: "emprego_fixo" as JobTipo }))}
            />
            <RadioRow
              label="Remoto / Home Office"
              selected={draft.tipo === "remoto"}
              onPress={() =>
                setDraft((d) => ({
                  ...d,
                  tipo: "remoto" as JobTipo,
                  formato: "remoto" as JobFormato,
                }))
              }
            />

            <Text style={styles.label}>Formato *</Text>
            <RadioRow
              label="Presencial"
              selected={draft.formato === "presencial"}
              onPress={() => setDraft((d) => ({ ...d, formato: "presencial" as JobFormato }))}
            />
            <RadioRow
              label="Home Office"
              selected={draft.formato === "remoto"}
              onPress={() => setDraft((d) => ({ ...d, formato: "remoto" as JobFormato }))}
            />
            <RadioRow
              label="Híbrido"
              selected={draft.formato === "hibrido"}
              onPress={() => setDraft((d) => ({ ...d, formato: "hibrido" as JobFormato }))}
            />

            <Text style={styles.label}>Quantidade de vagas *</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={String(draft.vagasTotal)}
              onChangeText={(t) =>
                setDraft((d) => ({ ...d, vagasTotal: Math.max(1, parseInt(t, 10) || 1) }))
              }
            />

            <Text style={styles.label}>Valor R$ *</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={draft.valor > 0 ? String(draft.valor) : ""}
              onChangeText={(t) => setDraft((d) => ({ ...d, valor: parseNum(t) }))}
              placeholder="0"
            />
            <Text style={styles.helper}>Faixa sugerida ({draft.categoria || "categoria"}): {priceHint}</Text>
            <Text style={styles.helperBlock}>
              Limpeza: R$120–200 · Garçom: R$150–250 · Churrasco: R$200–350{"\n"}
              Chapa: R$130–280 · Obras: R$120–280 · Motoboy: R$120–220{"\n"}
              Eleitoral: R$150–400 · Home Office: R$80–200
            </Text>
          </ScrollView>
        </OnboardingShell>
      ) : null}

      {step === 2 ? (
        <OnboardingShell {...shellProps} title="Calendário e horário" subtitle="Ajuste conforme o tipo de vaga.">
          <ScrollView keyboardShouldPersistTaps="handled">
            {draft.tipo === "diaria" ? (
              <>
                <Text style={styles.label}>Datas da diária *</Text>
                <Calendar
                  minDate={todayStr()}
                  markedDates={markedDates}
                  onDayPress={(day) => toggleDate(day.dateString)}
                  theme={{
                    selectedDayBackgroundColor: ACCENT,
                    todayTextColor: ACCENT,
                    arrowColor: ACCENT,
                  }}
                />
                <Text style={styles.label}>Horário início</Text>
                <TextInput
                  style={styles.input}
                  value={draft.horarioInicio ?? ""}
                  onChangeText={(horarioInicio) => setDraft((d) => ({ ...d, horarioInicio }))}
                  placeholder="08:00"
                />
                <Text style={styles.label}>Horário fim</Text>
                <TextInput
                  style={styles.input}
                  value={draft.horarioFim ?? ""}
                  onChangeText={(horarioFim) => setDraft((d) => ({ ...d, horarioFim }))}
                  placeholder="17:00"
                />
                <Text style={styles.helper}>
                  Duração: {jobDurationLabel(draft.horarioInicio, draft.horarioFim)}
                </Text>

                <View style={styles.switchRow}>
                  <Text style={styles.labelInline}>Recorrência</Text>
                  <Switch
                    value={draft.recorrente}
                    onValueChange={(recorrente) => setDraft((d) => ({ ...d, recorrente }))}
                    trackColor={{ true: ACCENT }}
                  />
                </View>
                {draft.recorrente ? (
                  <>
                    <View style={styles.weekRow}>
                      {WEEKDAYS.map((w) => {
                        const on = draft.diasRecorrencia.includes(w.id);
                        return (
                          <Pressable
                            key={w.id}
                            onPress={() => toggleWeekday(w.id)}
                            style={[styles.weekChip, on && { backgroundColor: ACCENT, borderColor: ACCENT }]}
                          >
                            <Text style={[styles.weekText, on && { color: "#fff" }]}>{w.label}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    <Text style={styles.label}>Repetir até</Text>
                    <Calendar
                      minDate={todayStr()}
                      markedDates={
                        draft.recorrenciaAte
                          ? { [draft.recorrenciaAte]: { selected: true, selectedColor: ACCENT } }
                          : {}
                      }
                      onDayPress={(day) => setDraft((d) => ({ ...d, recorrenciaAte: day.dateString }))}
                      theme={{ arrowColor: ACCENT, selectedDayBackgroundColor: ACCENT }}
                    />
                    <Text style={styles.previewRec}>{recurrencePreview(draft.diasRecorrencia, draft.recorrenciaAte)}</Text>
                  </>
                ) : null}
              </>
            ) : null}

            {draft.tipo === "emprego_fixo" || draft.tipo === "remoto" ? (
              <>
                {draft.tipo === "remoto" ? (
                  <View style={styles.switchRow}>
                    <Text style={styles.flexLabel}>Aceita qualquer cidade do Brasil</Text>
                    <Switch
                      value={draft.aceitaQualquerCidade}
                      onValueChange={(aceitaQualquerCidade) => setDraft((d) => ({ ...d, aceitaQualquerCidade }))}
                      trackColor={{ true: ACCENT }}
                    />
                  </View>
                ) : null}
                <Text style={styles.label}>Data de início *</Text>
                <Calendar
                  minDate={todayStr()}
                  markedDates={
                    draft.dataInicio
                      ? { [draft.dataInicio]: { selected: true, selectedColor: ACCENT } }
                      : {}
                  }
                  onDayPress={(day) => setDraft((d) => ({ ...d, dataInicio: day.dateString }))}
                  theme={{ arrowColor: ACCENT, selectedDayBackgroundColor: ACCENT }}
                />
                <Text style={styles.label}>Contrato *</Text>
                <View style={styles.rowChips}>
                  {CONTRATO_OPTIONS.map((c) => (
                    <Pressable
                      key={c.id}
                      onPress={() => setDraft((d) => ({ ...d, contrato: c.id as ContratoTipo }))}
                      style={[styles.miniChip, draft.contrato === c.id && styles.miniChipOn]}
                    >
                      <Text style={[styles.miniChipText, draft.contrato === c.id && styles.miniChipTextOn]}>
                        {c.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.label}>Carga *</Text>
                <View style={styles.rowChips}>
                  {CARGA_OPTIONS.map((c) => (
                    <Pressable
                      key={c.id}
                      onPress={() => setDraft((d) => ({ ...d, carga: c.id as CargaTipo }))}
                      style={[styles.miniChip, draft.carga === c.id && styles.miniChipOn]}
                    >
                      <Text style={[styles.miniChipText, draft.carga === c.id && styles.miniChipTextOn]}>
                        {c.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {draft.tipo === "emprego_fixo" ? (
                  <>
                    <Text style={styles.label}>Salário mensal (R$) *</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="decimal-pad"
                      value={draft.salarioMensal ? String(draft.salarioMensal) : ""}
                      onChangeText={(t) => setDraft((d) => ({ ...d, salarioMensal: parseNum(t) }))}
                    />
                  </>
                ) : null}
              </>
            ) : null}
          </ScrollView>
        </OnboardingShell>
      ) : null}

      {step === 3 ? (
        <OnboardingShell {...shellProps} title="Detalhes e local" subtitle="Quanto mais claro, melhores candidatos.">
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Descrição *</Text>
            <TextInput
              style={[styles.input, styles.area]}
              multiline
              maxLength={500}
              value={draft.descricao}
              onChangeText={(descricao) => setDraft((d) => ({ ...d, descricao }))}
            />
            <Text style={styles.counter}>{draft.descricao.length}/500</Text>

            <Text style={styles.label}>Requisitos (opcional)</Text>
            <TextInput
              style={[styles.input, styles.areaSm]}
              multiline
              maxLength={300}
              value={draft.requisitos}
              onChangeText={(requisitos) => setDraft((d) => ({ ...d, requisitos }))}
            />
            <Text style={styles.counter}>{draft.requisitos.length}/300</Text>

            <Text style={styles.label}>Benefícios</Text>
            <ChipSelect
              items={BENEFICIOS_PUBLISH}
              selected={draft.beneficios}
              onChange={(beneficios) => setDraft((d) => ({ ...d, beneficios }))}
              accentColor={ACCENT}
            />

            <View style={styles.switchRow}>
              <Text style={styles.flexLabel}>🔴 Esta vaga é urgente</Text>
              <Switch
                value={draft.urgente}
                onValueChange={(urgente) => setDraft((d) => ({ ...d, urgente }))}
                trackColor={{ true: "#DC2626" }}
              />
            </View>

            {draft.formato === "presencial" || draft.formato === "hibrido" ? (
              <>
                <Text style={styles.label}>CEP *</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  value={cepHook.cep || draft.cep || ""}
                  onChangeText={cepHook.setCep}
                  onBlur={() => void syncCepToDraft()}
                  placeholder="00000-000"
                />
                {cepHook.loading ? <ActivityIndicator color={ACCENT} /> : null}
                {cepHook.error ? <Text style={styles.err}>{cepHook.error}</Text> : null}
                <Text style={styles.label}>Endereço</Text>
                <TextInput style={styles.input} value={cepHook.result?.logradouro ?? ""} editable={false} />
                <Text style={styles.label}>Número *</Text>
                <TextInput style={styles.input} value={numero} onChangeText={setNumero} keyboardType="number-pad" />
                <Text style={styles.label}>Complemento</Text>
                <TextInput style={styles.input} value={complemento} onChangeText={setComplemento} />
                <Text style={styles.label}>Ponto de referência</Text>
                <TextInput
                  style={styles.input}
                  value={draft.referencia ?? ""}
                  onChangeText={(referencia) => setDraft((d) => ({ ...d, referencia }))}
                />
                {mapUrl ? (
                  <Image source={{ uri: mapUrl }} style={styles.map} resizeMode="cover" />
                ) : (
                  <Text style={styles.helper}>Mapa aparece após CEP válido (configure EXPO_PUBLIC_GOOGLE_MAPS_KEY).</Text>
                )}
              </>
            ) : null}
          </ScrollView>
        </OnboardingShell>
      ) : null}

      {step === 4 ? (
        <OnboardingShell {...shellProps} title="Preview e publicação" subtitle="Confira como a vaga aparece no feed.">
          <ScrollView>
            {previewJob ? (
              <JobCard job={previewJob} onPress={() => {}} highlightGrupo />
            ) : null}
            <Text style={styles.label}>Escopo</Text>
            <RadioRow label="Meu grupo (grátis)" selected onPress={() => {}} />
            <RadioRow label="Upgrade cidade — Em breve 🔒" selected={false} onPress={() => {}} />
          </ScrollView>
        </OnboardingShell>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  label: { fontWeight: "700", color: colors.mid, marginTop: 14, marginBottom: 6 },
  labelInline: { fontWeight: "700", color: colors.mid },
  flexLabel: { flex: 1, fontWeight: "700", color: colors.mid },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.white,
  },
  area: { minHeight: 100, textAlignVertical: "top" },
  areaSm: { minHeight: 72, textAlignVertical: "top" },
  counter: { fontSize: 11, color: colors.soft, alignSelf: "flex-end", marginTop: 4 },
  helper: { fontSize: 12, color: colors.soft, marginTop: 6 },
  helperBlock: { fontSize: 11, color: colors.soft, marginTop: 8, lineHeight: 18 },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "space-between" },
  catChip: {
    width: "48%",
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 10,
    backgroundColor: colors.white,
  },
  catChipOn: { borderColor: ACCENT, backgroundColor: "#E8EFFF" },
  catText: { fontSize: 12, fontWeight: "600", color: colors.mid },
  catTextOn: { color: ACCENT, fontWeight: "800" },
  radioRow: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 6 },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  radioLabel: { color: colors.dark, fontWeight: "600", flex: 1 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 12,
  },
  weekRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  weekChip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: colors.white,
  },
  weekText: { fontSize: 11, fontWeight: "700", color: colors.mid },
  previewRec: { marginTop: 10, fontStyle: "italic", color: colors.soft, fontSize: 13 },
  rowChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  miniChip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  miniChipOn: { borderColor: ACCENT, backgroundColor: "#E8EFFF" },
  miniChipText: { fontWeight: "600", color: colors.mid, fontSize: 12 },
  miniChipTextOn: { color: ACCENT, fontWeight: "800" },
  err: { color: "#DC2626", marginTop: 4 },
  map: { width: "100%", height: 160, borderRadius: 12, marginTop: 12, backgroundColor: colors.line },
});
