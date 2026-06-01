import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ChipSelect } from "../../../../src/components/ChipSelect";
import { RatingDisplay } from "../../../../src/components/RatingDisplay";
import { CONFIG } from "../../../../src/constants/config";
import { SKILLS } from "../../../../src/constants/empregado";
import { colors } from "../../../../src/constants/theme";
import { getCoinWallet } from "../../../../src/lib/coins";
import {
  countCompletedDiarias,
  getProfileCompletion,
  maybeAwardProfileCompleteCoins,
  updateProfile,
  uploadAvatar,
} from "../../../../src/lib/profile";
import { fetchRatings, type RatingRow } from "../../../../src/lib/ratings";
import { supabase } from "../../../../src/lib/supabase";

function initials(nome: string) {
  const p = nome.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "?";
  return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
}

export default function PerfilCompletoScreen() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [cidade, setCidade] = useState("");
  const [bio, setBio] = useState("");
  const [foto, setFoto] = useState<string | null>(null);
  const [criadoEm, setCriadoEm] = useState<string | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [completion, setCompletion] = useState(0);
  const [missing, setMissing] = useState<string[]>([]);
  const [diarias, setDiarias] = useState(0);
  const [balance, setBalance] = useState(0);
  const [reviews, setReviews] = useState<RatingRow[]>([]);
  const [savedHint, setSavedHint] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [draftSkills, setDraftSkills] = useState<string[]>([]);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return;
    setUserId(uid);
    const { data: u } = await supabase
      .from("users")
      .select("nome, cidade, bio, foto_url, criado_em")
      .eq("id", uid)
      .maybeSingle();
    if (u) {
      setNome(u.nome);
      setCidade(u.cidade ?? "");
      setBio(u.bio ?? "");
      setFoto(u.foto_url);
      setCriadoEm(u.criado_em);
    }
    const { data: sk } = await supabase.from("user_skills").select("skill").eq("user_id", uid);
    setSkills((sk ?? []).map((s) => s.skill));
    const comp = await getProfileCompletion(uid);
    setCompletion(comp.percent);
    setMissing(comp.missing);
    setDiarias(await countCompletedDiarias(uid));
    const w = await getCoinWallet(uid);
    setBalance(w.available);
    setReviews(await fetchRatings(uid, 5, 0));
    const awarded = await maybeAwardProfileCompleteCoins(uid);
    if (awarded) Alert.alert("Perfil completo!", "+20 moedas 🎉");
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  async function saveBio() {
    if (!userId) return;
    await updateProfile(userId, { bio: bio.trim().slice(0, 300) });
    flashSaved();
    const comp = await getProfileCompletion(userId);
    setCompletion(comp.percent);
    setMissing(comp.missing);
    void maybeAwardProfileCompleteCoins(userId);
  }

  function flashSaved() {
    setSavedHint(true);
    setTimeout(() => setSavedHint(false), 2000);
  }

  async function pickPhoto() {
    if (!userId) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const pick = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (pick.canceled || !pick.assets[0]?.uri) return;
    try {
      const url = await uploadAvatar(userId, pick.assets[0].uri);
      setFoto(url);
      flashSaved();
      const comp = await getProfileCompletion(userId);
      setCompletion(comp.percent);
      setMissing(comp.missing);
    } catch (e) {
      Alert.alert("Foto", e instanceof Error ? e.message : "Não foi possível enviar.");
    }
  }

  async function saveSkills() {
    if (!userId) return;
    await supabase.from("user_skills").delete().eq("user_id", userId);
    if (draftSkills.length) {
      await supabase.from("user_skills").insert(
        draftSkills.map((skill) => ({ user_id: userId, skill }))
      );
    }
    setSkills(draftSkills);
    setSkillsOpen(false);
    flashSaved();
    const comp = await getProfileCompletion(userId);
    setCompletion(comp.percent);
    setMissing(comp.missing);
  }

  if (loading || !userId) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.green} size="large" />
      </View>
    );
  }

  const memberSince = criadoEm
    ? new Date(criadoEm).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
    : "—";

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: 48 }}>
      <LinearGradient colors={["#065F46", colors.green]} style={styles.hero}>
        <Pressable onPress={() => void pickPhoto()} style={styles.avatarWrap}>
          {foto ? (
            <Image source={{ uri: foto }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPh]}>
              <Text style={styles.avatarText}>{initials(nome)}</Text>
            </View>
          )}
          <Text style={styles.cam}>📷</Text>
        </Pressable>
        <Text style={styles.heroName}>{nome}</Text>
        <Text style={styles.heroCity}>{cidade}</Text>
        <View style={styles.ratingWrap}>
          <RatingDisplay userId={userId} variant="full" accentColor="#fff" />
        </View>
        <Text style={styles.heroMeta}>
          {diarias} diárias realizadas · membro desde {memberSince}
        </Text>
        <Pressable
          style={styles.shareBtn}
          onPress={() =>
            void Share.share({
              message: `Veja meu perfil na Diária da Cidade: ${CONFIG.WEB_URL}/trabalhe`,
            })
          }
        >
          <Text style={styles.shareBtnText}>Compartilhar perfil</Text>
        </Pressable>
      </LinearGradient>

      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>
          Perfil {completion}% completo {savedHint ? "· Salvo ✓" : ""}
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${completion}%` }]} />
        </View>
        <Text style={styles.progressHint}>Complete para ganhar +20 moedas e aparecer mais</Text>
        {missing.slice(0, 3).map((m) => (
          <Text key={m} style={styles.missing}>
            · {m}
          </Text>
        ))}
      </View>

      <Section title="Habilidades">
        <View style={styles.chips}>
          {skills.map((s) => (
            <Text key={s} style={styles.chip}>
              {s}
            </Text>
          ))}
        </View>
        <Pressable
          onPress={() => {
            setDraftSkills(skills);
            setSkillsOpen(true);
          }}
        >
          <Text style={styles.link}>Editar</Text>
        </Pressable>
      </Section>

      <Section title="Sobre mim">
        <TextInput
          style={styles.bio}
          value={bio}
          onChangeText={setBio}
          multiline
          maxLength={300}
          placeholder="Conte sobre você para os contratantes"
          onBlur={() => void saveBio()}
        />
      </Section>

      <Section title="Avaliações recebidas">
        <RatingDisplay userId={userId} variant="mini" accentColor={colors.green} />
        {reviews.map((r) => (
          <Text key={r.id} style={styles.reviewLine}>
            ★{r.nota} · {r.avaliador_nome} · {r.job_titulo}
          </Text>
        ))}
        <Pressable onPress={() => router.push("/(app)/(empregado)/perfil/ratings")}>
          <Text style={styles.link}>Ver todas</Text>
        </Pressable>
      </Section>

      <Section title="Conquistas e moedas">
        <Text style={styles.coins}>🪙 {balance} moedas</Text>
        <Text style={styles.subMeta}>{diarias} diárias concluídas</Text>
        <Pressable onPress={() => router.push("/(app)/(empregado)/moedas")}>
          <Text style={styles.link}>Ver extrato</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/(app)/(empregado)/destaque")}>
          <Text style={styles.link}>Destaque no feed →</Text>
        </Pressable>
      </Section>

      <Pressable
        style={styles.out}
        onPress={async () => {
          await supabase.auth.signOut();
          router.replace("/(auth)/choose-profile");
        }}
      >
        <Text style={styles.outText}>Sair</Text>
      </Pressable>

      <Modal visible={skillsOpen} animationType="slide">
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Habilidades</Text>
          <ChipSelect
            items={SKILLS}
            selected={draftSkills}
            onChange={setDraftSkills}
            max={6}
          />
          <Pressable style={styles.saveModal} onPress={() => void saveSkills()}>
            <Text style={styles.saveModalText}>Salvar</Text>
          </Pressable>
        </View>
      </Modal>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: { padding: 24, alignItems: "center" },
  avatarWrap: { position: "relative", marginBottom: 12 },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarPh: { backgroundColor: "rgba(255,255,255,.2)", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "800" },
  cam: { position: "absolute", bottom: 0, right: 0, backgroundColor: "#fff", borderRadius: 14, padding: 4 },
  heroName: { color: "#fff", fontSize: 22, fontWeight: "800" },
  heroCity: { color: "rgba(255,255,255,.85)", marginTop: 4 },
  ratingWrap: { marginTop: 12, width: "100%" },
  heroMeta: { color: "rgba(255,255,255,.75)", fontSize: 12, marginTop: 8 },
  shareBtn: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.5)",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  shareBtnText: { color: "#fff", fontWeight: "700" },
  progressCard: {
    margin: 16,
    padding: 14,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  progressTitle: { fontWeight: "800", color: colors.dark },
  progressTrack: {
    height: 8,
    backgroundColor: colors.line,
    borderRadius: 4,
    marginTop: 10,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: colors.green },
  progressHint: { fontSize: 12, color: colors.soft, marginTop: 8 },
  missing: { fontSize: 11, color: colors.mid, marginTop: 4 },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: colors.dark, marginBottom: 10 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 12,
  },
  link: { color: colors.primary, fontWeight: "700", marginTop: 8 },
  bio: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.white,
    textAlignVertical: "top",
  },
  reviewLine: { fontSize: 12, color: colors.mid, marginTop: 6 },
  coins: { fontSize: 18, fontWeight: "800", color: colors.dark },
  subMeta: { color: colors.soft, marginTop: 4 },
  out: { marginHorizontal: 16, marginTop: 8 },
  outText: { color: colors.primary, fontWeight: "700" },
  modal: { flex: 1, padding: 24, paddingTop: 48, backgroundColor: colors.bg },
  modalTitle: { fontSize: 20, fontWeight: "800", marginBottom: 16 },
  saveModal: {
    marginTop: 24,
    backgroundColor: colors.green,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveModalText: { color: "#fff", fontWeight: "800" },
});
