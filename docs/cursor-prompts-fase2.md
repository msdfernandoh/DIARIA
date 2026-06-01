# Diária da Cidade — Prompts Fase 2
## Moedas visíveis · Avaliações · Oportunidades físicas · Upgrades · Admin

**Pré-requisito:** Fase 1 completa (15/15 ✅)  
**Stack:** Expo Router + Supabase (mesmo padrão da Fase 1)  
**Ativar quando:** 200+ usuários ativos na plataforma

---

## COMO USAR

Cole um prompt por vez no Cursor.  
Teste no Expo Go antes de avançar.  
Ordem importa — cada prompt depende do anterior.

---

## PROMPT F2-01 — Tela de moedas e extrato

```
Implemente a tela de moedas e extrato do usuário.
Padrão Expo Router. Cor do perfil do usuário logado.

ARQUIVO: app/(app)/(empregado)/moedas/index.tsx
(reutilizar para empregador em app/(app)/(empregador)/moedas/index.tsx)

HEADER HERO (gradiente da cor do perfil):
  Ícone 🪙 centralizado
  "Seu saldo"
  Saldo em número grande: "247 moedas"
  Saldo bloqueado abaixo (se houver):
    "🔒 100 moedas liberadas em X dias"
    Tooltip: "Moedas de bônus ficam bloqueadas 7 dias"

SEÇÃO: O que você pode fazer com moedas
  Cards horizontais em scroll:
    [🔝 Currículo no topo · 100 moedas · 7 dias]
    [✅ Badge verificado · 80 moedas · 30 dias]
    [⚡ Candidatura express · 30 moedas]
  Para empregador:
    [📌 Vaga em destaque · 200 moedas · 7 dias]
    [🔍 Filtro avançado · 150 moedas · 30 dias]
  Cada card tem botão "Usar" que abre ConfirmModal
  ConfirmModal:
    "Usar X moedas para [produto]?"
    "Saldo após: Y moedas"
    [Confirmar] [Cancelar]
  Ao confirmar:
    Chamar src/lib/coins.ts → spendCoins(userId, amount, reason, refId)
    Verificar saldo suficiente antes (saldo >= amount AND bloqueado = false)
    Se insuficiente: "Saldo insuficiente. Ganhe mais indicando amigos!"

SEÇÃO: Como ganhar mais moedas
  Lista simples com ícone + ação + valor:
    👥 Indicar um profissional que ficou ativo → +50 moedas
    🏢 Indicar um empregador que publicou vaga → +80 moedas
    ✅ Concluir uma diária com avaliação → +10 moedas
    ⭐ Receber avaliação 5 estrelas → +5 moedas
    👤 Completar perfil 100% → +20 moedas
    📅 Usar o app 7 dias seguidos → +15 moedas
  Botão "Compartilhar meu link" → Share.share com link de indicação

SEÇÃO: Extrato (FlatList)
  Query: SELECT * FROM coin_transactions 
         WHERE user_id = current_user 
         ORDER BY created_at DESC
  Card de cada transação:
    Ícone (verde ↑ ganho / vermelho ↓ gasto)
    Reason traduzido para português:
      cadastro_sem_codigo → "Bônus de cadastro"
      cadastro_com_codigo → "Bônus com código de indicação"
      indicacao_empregado → "Indicação de profissional"
      indicacao_empregador → "Indicação de empregador"
      diaria_concluida → "Diária concluída"
      avaliacao_5_estrelas → "Avaliação 5 estrelas recebida"
      perfil_completo → "Perfil 100% completo"
      streak_7_dias → "7 dias consecutivos no app"
      curriculo_topo → "Currículo no topo (gasto)"
      vaga_destaque → "Vaga em destaque (gasto)"
      badge_verificado → "Badge verificado (gasto)"
    Valor: "+50" verde ou "-100" vermelho
    Data relativa
    Se bloqueado: ícone 🔒 + "Libera em X dias"

ARQUIVO: src/lib/coins.ts (complementar o existente)
  spendCoins(userId, amount, reason, refId?):
    Verificar saldo disponível (balance - bloqueado)
    UPDATE user_coins SET balance = balance - amount
    INSERT coin_transactions type='spend'
    Retornar { success, newBalance }
  
  earnCoins(userId, amount, reason, refId?, blocked=false):
    UPDATE user_coins SET balance = balance + amount, total_earned = total_earned + amount
    INSERT coin_transactions type='earn', bloqueado=blocked, libera_em=(blocked ? +7 dias : null)
  
  checkAndUnlockCoins(userId):
    SELECT coin_transactions WHERE bloqueado=true AND libera_em <= NOW()
    Para cada uma: UPDATE bloqueado=false (saldo já estava incluído no balance)
    Chamar no app ao abrir a tela de moedas

Adicionar aba "🪙 Moedas" no bottom tab do empregado e empregador.
Não criar React Navigation — manter Expo Router.
```

---

## PROMPT F2-02 — Sistema de avaliações

```
Implemente o sistema completo de avaliações pós-diária.

ARQUIVO: src/lib/ratings.ts
  submitRating(params):
    Verificar que application.status = 'concluida'
    Verificar que ainda não avaliou (UNIQUE application_id + avaliador_id)
    INSERT em ratings
    Atualizar nota média em users: 
      UPDATE users SET nota_media = (SELECT AVG(nota) FROM ratings WHERE avaliado_id = userId)
    earnCoins para o avaliador: +3 moedas (reason: 'avaliou_contratante' ou 'avaliou_candidato')
    Se nota = 5: earnCoins para o avaliado: +5 moedas (reason: 'avaliacao_5_estrelas')
  
  fetchRatings(userId, limit=10, offset=0):
    SELECT ratings + avaliador nome/foto + job titulo
    ORDER BY criado_em DESC
  
  fetchRatingSummary(userId):
    nota_media, total_avaliacoes
    distribuicao: { 5: N, 4: N, 3: N, 2: N, 1: N }
    topicos_mais_citados: array de { tag, count } ORDER BY count DESC LIMIT 5

TRIGGER DE AVALIAÇÃO:
  Quando application.status muda para 'concluida':
    INSERT em notifications ou enviar push para AMBOS os lados:
      "✅ Diária concluída! Como foi? Avalie sua experiência"
      data: { tipo: 'avaliar', applicationId }
  Prazo: se não avaliar em 48h, não pode mais avaliar (application.avaliacao_expires_at)

TELA: app/(app)/avaliar/[applicationId].tsx
  Acessível por ambos os perfis (empregado e empregador)
  
  Card do outro lado (quem será avaliado):
    Avatar + nome + cargo/empresa
  
  ESTRELAS (1 a 5):
    5 estrelas interativas (TouchableOpacity)
    Animação ao selecionar (scale 1.3 → 1.0)
    Cor: #F59E0B selecionada, #E2E8F0 não selecionada
  
  TÓPICOS (chips multi-select, aparecem após selecionar estrelas):
    SE avaliando empregado:
      ✅ Pontual    🔒 Confiável    💬 Comunicativo
      🧹 Caprichoso   🤝 Respeitoso   🚗 Tem transporte
    SE avaliando empregador:
      💰 Pagou no prazo   📋 Explicou bem a tarefa
      🤝 Respeitoso       ✅ Organizado
      🔄 Contrataria de novo
  
  COMENTÁRIO (TextInput opcional, max 200 chars)
  
  Botão [Enviar avaliação ⭐] (cor do perfil)
  
  Após enviar:
    earnCoins +3 para quem avaliou
    Se nota 5: earnCoins +5 para quem foi avaliado
    router.back() com toast "Avaliação enviada!"

COMPONENTE: src/components/RatingDisplay.tsx
  Props: userId, variant ('mini' | 'full' | 'summary')
  
  variant='mini' (para cards do feed e listas):
    ★ 4.9 (38)
  
  variant='full' (para perfil):
    Nota grande + estrelas + total
    Barra de distribuição (5★ 88%, 4★ 10%, etc.)
    Tópicos mais citados como chips
  
  variant='summary' (para detalhe da vaga — sobre o contratante):
    Avatar + nota + total + 2 tópicos principais

INTEGRAR em:
  JobDetailScreen: RatingDisplay do contratante (variant='summary')
  PerfilEmpregado: RatingDisplay (variant='full') + lista de avaliações recebidas
  PainelEmpregador: RatingDisplay (variant='mini') do próprio perfil
  ChatConversationScreen: botão "Avaliar" quando status='concluida'

MIGRATION: supabase/migrations/20260601000000_ratings_triggers.sql
  Adicionar coluna nota_media DECIMAL(3,1) em users (se não existir)
  Adicionar coluna avaliacao_expires_at TIMESTAMP em applications
  Trigger: quando status='concluida', setar avaliacao_expires_at = NOW() + 48h

Não criar React Navigation — manter Expo Router.
```

---

## PROMPT F2-03 — Oportunidades físicas com QR Code

```
Implemente o sistema de oportunidades físicas (brindes com QR Code).

MIGRATION: supabase/migrations/20260601100000_physical_opportunities.sql
  Criar tabelas:
  
  physical_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID FK users.id,
    empreendedor_id UUID FK users.id,
    titulo VARCHAR(80) NOT NULL,
    descricao TEXT,
    foto_url TEXT,
    custo_moedas INTEGER NOT NULL,
    quantidade_total INTEGER NOT NULL,
    quantidade_restante INTEGER NOT NULL CHECK (quantidade_restante >= 0),
    escopo TEXT DEFAULT 'grupo',
    grupo_id UUID,
    cidade VARCHAR(80),
    estado CHAR(2),
    local_nome VARCHAR(100),
    local_endereco TEXT,
    lat DECIMAL(10,7),
    lng DECIMAL(10,7),
    valida_ate TIMESTAMP NOT NULL,
    ativa BOOLEAN DEFAULT true,
    criado_em TIMESTAMP DEFAULT NOW()
  )
  
  physical_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    oportunidade_id UUID FK physical_opportunities.id,
    user_id UUID FK users.id,
    moedas_gastas INTEGER NOT NULL,
    qrcode_token VARCHAR(64) UNIQUE NOT NULL,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','confirmado','expirado','cancelado')),
    resgatado_em TIMESTAMP DEFAULT NOW(),
    expira_em TIMESTAMP DEFAULT NOW() + INTERVAL '48 hours',
    confirmado_em TIMESTAMP,
    confirmado_por UUID FK users.id
  )
  
  INDEX em physical_opportunities(cidade, ativa, valida_ate)
  INDEX em physical_redemptions(qrcode_token)
  RLS: usuários autenticados podem ler; empresa gerencia as próprias

ARQUIVO: src/lib/opportunities.ts
  
  fetchOpportunities(userId, cidade):
    SELECT * FROM physical_opportunities
    WHERE ativa = true 
      AND valida_ate > NOW() 
      AND quantidade_restante > 0
      AND (escopo = 'cidade' AND cidade = $cidade
           OR escopo = 'grupo' AND grupo_id = $user_grupo_id)
    ORDER BY valida_ate ASC
  
  redeemOpportunity(userId, opportunityId):
    ⚠️ OPERAÇÃO ATÔMICA — usar RPC Supabase:
    Criar supabase/migrations/20260601200000_redeem_rpc.sql com:
    
    CREATE OR REPLACE FUNCTION redeem_opportunity(
      p_user_id UUID, p_opp_id UUID, p_token VARCHAR
    ) RETURNS JSON AS $$
    DECLARE
      v_opp physical_opportunities;
      v_saldo INTEGER;
    BEGIN
      SELECT * INTO v_opp FROM physical_opportunities 
      WHERE id = p_opp_id FOR UPDATE;
      
      IF v_opp.quantidade_restante <= 0 THEN
        RETURN '{"error":"esgotado"}'::JSON;
      END IF;
      IF v_opp.valida_ate < NOW() THEN
        RETURN '{"error":"expirado"}'::JSON;
      END IF;
      
      SELECT balance INTO v_saldo FROM user_coins WHERE user_id = p_user_id;
      IF v_saldo < v_opp.custo_moedas THEN
        RETURN '{"error":"saldo_insuficiente"}'::JSON;
      END IF;
      
      UPDATE user_coins SET balance = balance - v_opp.custo_moedas WHERE user_id = p_user_id;
      UPDATE physical_opportunities SET quantidade_restante = quantidade_restante - 1 WHERE id = p_opp_id;
      INSERT INTO physical_redemptions (oportunidade_id, user_id, moedas_gastas, qrcode_token)
      VALUES (p_opp_id, p_user_id, v_opp.custo_moedas, p_token);
      INSERT INTO coin_transactions (user_id, type, amount, reason, ref_id)
      VALUES (p_user_id, 'spend', v_opp.custo_moedas, 'oportunidade_fisica', p_opp_id);
      
      RETURN '{"success":true}'::JSON;
    END;
    $$ LANGUAGE plpgsql;
  
  confirmRedemption(token, empresaUserId):
    UPDATE physical_redemptions 
    SET status='confirmado', confirmado_em=NOW(), confirmado_por=empresaUserId
    WHERE qrcode_token = token AND status = 'pendente'
    RETURNING *
    Se não retornar nada: token já usado ou expirado

TELAS:

TELA 1: app/(app)/(empregado)/oportunidades/index.tsx
  Lista de oportunidades disponíveis para o usuário
  Card de cada oportunidade:
    Foto (se tiver) ou emoji grande do tipo
    Título + local_nome
    Custo em moedas (🪙 80 moedas)
    Quantidade restante: "3 restantes" (vermelho se ≤ 3)
    Validade: "Válido até domingo 23h"
    Distância do usuário (se tiver lat/lng)
  
  Ao tocar:
    Modal de confirmação:
      Foto/emoji grande
      "Trocar 80 moedas por 1 Chop Long Neck?"
      "Seu saldo: 247 → 167 moedas"
      "Válido por 48h após resgatar"
      [Resgatar agora] [Cancelar]
    
    Ao confirmar:
      Gerar token: crypto.randomUUID() + Date.now()
      Chamar redeemOpportunity (RPC atômica)
      Se success: router.push para tela do QR Code
      Se error: Toast com mensagem amigável

TELA 2: app/(app)/(empregado)/oportunidades/qrcode/[redemptionId].tsx
  Tela do QR Code após resgate
  QR Code grande centralizado (react-native-qrcode-svg):
    Valor: "diariadacidade.app.br/qr/[token]"
    Tamanho: 240x240
  Título da oportunidade
  Local onde resgatar
  Contador regressivo: "Expira em 47:23:15" (atualiza a cada segundo)
  Instrução: "Mostre este QR Code no estabelecimento"
  Botão "Salvar na galeria" (expo-media-library)
  
  Se expirado: mostrar tela de expiração + "Moedas devolvidas"

TELA 3: app/(app)/(empregador)/qr-scanner.tsx
  Para a empresa confirmar o resgate do cliente
  expo-barcode-scanner ou expo-camera com barcode scanning
  Ao ler QR Code:
    Extrair token da URL
    Chamar confirmRedemption(token, empresaUserId)
    Se success: tela de confirmação verde "✅ Resgate confirmado!"
    Se já usado: "❌ Este QR Code já foi utilizado"
    Se expirado: "⏰ QR Code expirado"

TELA 4: app/(app)/(empreendedor)/oportunidades/nova.tsx
  Formulário para empreendedor criar oportunidade física:
    Título (TextInput)
    Tipo (Select): 🍺 Chop · 🍔 Hambúrguer · 🍕 Pizza · 🎟️ Ingresso · 💈 Serviço · Outro
    Custo em moedas (NumberInput, sugestão: 80)
    Quantidade disponível (NumberInput)
    Data e hora de validade (DateTimePicker)
    Local: nome + CEP (ViaCEP)
    Escopo: ● Meu grupo ○ Toda a cidade
    Upload de foto (opcional, expo-image-picker → Supabase Storage)
  
  Ao criar:
    Cobrar da empresa (mostrar Pix do empreendedor)
    INSERT em physical_opportunities após confirmar pagamento
    Toast "Oportunidade criada!"

Adicionar aba "🎁 Oportunidades" no tab do empregado.
Não criar React Navigation — manter Expo Router.
```

---

## PROMPT F2-04 — Perfil completo do empregado

```
Implemente a tela de perfil completo do empregado com edição.

ARQUIVO: app/(app)/(empregado)/perfil/index.tsx

HERO (gradiente verde):
  Foto de perfil (expo-image-picker) ou avatar com iniciais
  Botão editar foto (ícone de câmera sobre o avatar)
  Nome + cidade
  RatingDisplay variant='full'
  "X diárias realizadas · membro desde [mês/ano]"
  Botão "Compartilhar perfil" → Share com link público

SEÇÃO: Habilidades
  Chips das skills atuais
  Botão "Editar" → modal com grid de chips (mesmo do onboarding)

SEÇÃO: Disponibilidade
  Resumo: "Disponível Seg, Ter, Qui · Manhã e Tarde · até 10km"
  Botão "Editar" → tela de disponibilidade (mesmo do onboarding Step 4)

SEÇÃO: Sobre mim
  Texto livre (TextArea max 300 chars)
  "Conte sobre você para os contratantes"

SEÇÃO: Experiências
  Lista de experiências
  Botão "+ Adicionar" → modal (mesmo do onboarding Step 6)
  Swipe para deletar

SEÇÃO: Avaliações recebidas
  RatingDisplay variant='summary'
  FlatList de avaliações (últimas 5)
  Botão "Ver todas" → tela ratings/index.tsx

SEÇÃO: Conquistas e moedas
  Saldo atual: "🪙 247 moedas"
  Badge verificado (se ativo)
  Diárias concluídas
  Maior streak
  Botão "Ver extrato" → moedas/index.tsx

EDIÇÃO INLINE:
  Campos editáveis com ícone de lápis
  Salvar automaticamente ao sair do campo (onBlur)
  Feedback visual de "Salvo ✓"

ARQUIVO: src/lib/profile.ts
  updateProfile(userId, data): UPDATE users
  uploadAvatar(userId, imageUri): 
    Resize para 400x400 (expo-image-manipulator)
    Upload para Supabase Storage: avatars/{userId}/avatar.jpg
    UPDATE users SET foto_url
  getProfileCompletion(userId) → porcentagem 0-100:
    foto_url: +20%
    bio: +10%
    skills (≥3): +20%
    experiencias (≥1): +20%
    disponibilidade: +15%
    celular_visivel: +15%
  
  Quando atingir 100% pela primeira vez:
    earnCoins +20 (reason: 'perfil_completo')
    Toast "Perfil completo! +20 moedas 🎉"

BARRA DE PROGRESSO DO PERFIL:
  Mostrar no topo da tela de perfil
  "Perfil 65% completo"
  ProgressBar verde
  "Complete para ganhar +20 moedas e aparecer mais"
  Lista de itens faltando: "Adicione uma foto · Conte sobre você"

Não criar React Navigation — manter Expo Router.
```

---

## PROMPT F2-05 — Telas de preview para não autenticados

```
Implemente as telas de preview para usuários não autenticados.
(CADASTRO INTERESSANTE — conforme planejado)

OBJETIVO: usuário vê o produto funcionando antes de criar conta.
Aumenta conversão no onboarding.

MIGRATION: supabase/migrations/20260601300000_demo_jobs.sql
  Adicionar coluna is_demo BOOLEAN DEFAULT false em jobs
  INSERT de 6 vagas demo:
    Garçom urgente hoje · R$180 · Sinop
    Diarista sexta · R$160 · 1,2km
    Churrasqueiro sábado · R$280 · Evento
    Chapa de mudança amanhã · R$200 · sem exp.
    Atendente home office · R$120/dia · qualquer cidade
    Cabo eleitoral semana · R$220/dia · sua cidade
  Feed real: WHERE is_demo = false
  Feed preview: WHERE is_demo = true

TELA 1: app/(public)/vagas-preview.tsx
  Mesmo visual do feed real (JobCard, badges, urgente, estrelas)
  Header com "👋 Veja vagas disponíveis"
  Subtítulo: "Cadastre-se grátis para se candidatar"
  
  FlatList com vagas demo (is_demo=true)
  JobCard idêntico ao feed real — mesmo componente
  
  Ao tocar em qualquer card:
    Abrir detalhe normalmente (mesmo JobDetailScreen)
    Ao tocar em "Me candidatar":
      NÃO processar candidatura
      BottomSheet animado:
        "Para se candidatar, crie sua conta grátis"
        "2 minutos. Sem cartão. Sem taxa."
        [Criar conta grátis →] → choose-profile
        [Já tenho conta] → login
  
  Botão fixo no rodapé:
    "Ver X vagas na sua cidade →" → choose-profile

TELA 2: app/(public)/contratar-preview.tsx
  Cards de "contratações realizadas" (mockados):
    [✅ João M. · Garçom · contratado em 38 min]
    [✅ Buffet Estrela · 3 garçons · evento sábado]
    [✅ Família Costa · Diarista · toda sexta 🔄]
    [✅ Construtora · 2 chapas · segunda 8h]
    [✅ Restaurante · Churrasqueiro · evento 280]
  
  Estilo: card branco com borda esquerda verde, avatar iniciais
  
  Contador animado no topo:
    "🔥 47 profissionais contratados esta semana"
    Número incrementa de 0 até 47 em 2 segundos ao montar
  
  Botão fixo no rodapé:
    [Publicar minha vaga — grátis →] → choose-profile com tipo=empregador

INTEGRAR em app/(auth)/choose-profile.tsx:
  Abaixo dos 3 botões de perfil, adicionar links sutis:
    "Ver vagas disponíveis →" → vagas-preview
    "Ver como funciona para empresas →" → contratar-preview
  
  Ou: ao abrir o app sem sessão, mostrar vagas-preview primeiro
  com botão "Sou empresa" e "Quero empreender" no rodapé

ARQUIVO: app/(public)/_layout.tsx
  Layout sem autenticação (sem verificar sessão)
  Header simples com logo e botão "Entrar"

Não criar React Navigation — manter Expo Router.
```

---

## PROMPT F2-06 — Upgrade de destaque (cidade)

```
Implemente o fluxo de upgrade de destaque para toda a cidade.

CONTEXTO:
  Topo do grupo (já existe): R$9/semana → aparece no topo só do grupo
  Upgrade cidade (novo): +R$5/semana → aparece no topo para TODOS da cidade

ARQUIVO: src/lib/highlights.ts (complementar o existente)

  purchaseHighlight(params):
    Verificar se já tem destaque ativo para este item
    INSERT em highlights:
      { tipo_entidade, entidade_id, nivel, grupo_id, empreendedor_id,
        valor_cobrado, ativo_de: NOW(), ativo_ate: NOW() + 7 dias }
    UPDATE jobs SET destaque_nivel, destaque_grupo_id, destaque_ate
    Registrar em commissions:
      topo_grupo: empreendedor 90%, master 10%
      upgrade_cidade: empreendedor 50%, admin_cidade 25%, master 25%
    Retornar { success, highlight }
  
  checkAndExpireHighlights():
    UPDATE jobs SET destaque_nivel='organico', destaque_grupo_id=null
    WHERE destaque_ate < NOW() AND destaque_nivel != 'organico'
    Cron job diário (daily-notifications já existente — adicionar este check)

FLUXO NO APP (tela de destaque):
  
  PARA EMPREGADO (currículo no topo):
    app/(app)/(empregado)/destaque/index.tsx
    
    Mostrar status atual:
      SE sem destaque: "Seu currículo aparece na posição orgânica"
      SE com destaque ativo: "✅ No topo até [data]" + barra de tempo restante
    
    Opções:
      [⭐ Topo do meu grupo · R$9/semana]
        "Apareça primeiro para contratantes do grupo [nome_instancia]"
        Botão "Contratar" → tela de pagamento Pix
      
      [🏙️ Topo da cidade · R$14/semana] (9 + 5)
        "Apareça primeiro para TODOS da cidade"
        Badge "Mais visibilidade"
        Botão "Contratar" → tela de pagamento Pix
      
      OU usar moedas:
        [🪙 Usar 100 moedas → topo do grupo por 7 dias]
        Só disponível se tiver moedas suficientes
  
  PARA EMPREGADOR (vaga no topo):
    app/(app)/(empregador)/destaque/[jobId].tsx
    
    Mesma lógica mas para vagas:
      Topo do grupo: R$9/semana
      Topo da cidade: R$14/semana (9+5)
      Usar moedas: 200 moedas → topo do grupo 7 dias

TELA DE PAGAMENTO PIX:
  app/(app)/pagamento/pix.tsx
  Recebe: { valor, produto, empreendedor_id, callback_route }
  
  Buscar chave Pix do empreendedor em entrepreneurs
  Mostrar:
    Valor em destaque: "R$ 9,00"
    Produto: "Currículo no topo por 7 dias"
    
    Card Pix:
      "Pagar para: [nome_conta]"
      "Chave: [chave_pix]" + botão copiar
      "Banco: [banco]"
    
    Botão [📋 Copiar chave Pix]
    Botão [✅ Já fiz o pagamento]
    
  Ao clicar "Já fiz o pagamento":
    Mostrar: "Aguardando confirmação do parceiro"
    O empreendedor confirma manualmente no painel
    (automação via webhook Pix será Fase 3)
  
  Ao empreendedor confirmar (no painel → vendas → confirmar pagamento):
    Ativar o destaque (purchaseHighlight)
    Notificação push para quem pagou: "✅ Seu destaque foi ativado!"

INTEGRAR:
  PainelEmpreendedor → vendas/nova.tsx: incluir opção de confirmar pagamento recebido
  JobDetailScreen: mostrar badge "Patrocinado" discreto se destaque ativo
  Feed: já usa prioridade — o UPDATE em jobs.destaque_nivel já funciona

Não criar React Navigation — manter Expo Router.
```

---

## PROMPT F2-07 — Painel Admin Master (web)

```
Implemente o painel admin master como página web (Next.js ou HTML puro).
Acesso restrito: só usuários com tipo='admin_master'.

ARQUIVO: web/admin/index.html (página estática protegida por senha)
OU criar app/(app)/(admin)/dashboard.tsx se preferir no app.

Implementar no app como tela separada acessível só para admin_master.

ARQUIVO: app/(app)/(admin)/dashboard.tsx

VERIFICAÇÃO DE ACESSO:
  Ao montar: buscar users.tipo do usuário logado
  Se não for 'admin_master': router.replace('/') imediatamente

MÉTRICAS GLOBAIS (cards no topo):
  Total usuários: COUNT users (por tipo)
  Vagas ativas: COUNT jobs WHERE ativa=true
  Diárias concluídas: COUNT applications WHERE status='concluida'
  Empreendedores ativos: COUNT entrepreneurs WHERE status='ativo'
  Receita do mês: SUM commissions.valor_plataforma (mês atual)
  Volume total: SUM commissions.valor_bruto (mês atual)

TERMÔMETRO DE CRESCIMENTO:
  Barra visual 0-100% com as 4 fases:
    0-40%:  🟢 Tudo grátis (ATUAL)
    40-70%: ⏳ Limitar alcance cidade
    70-90%: 🔒 Vaga grátis só local
    90-100%: 🏆 Freemium completo
  
  Slider para ajustar manualmente (só admin)
  Cada fase tem toggle para ativar/desativar
  UPDATE em uma tabela platform_config:
    CREATE TABLE platform_config (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMP
    )
    INSERT: { key: 'growth_pct', value: '34' }

LISTA DE EMPREENDEDORES:
  Tabela com: nome, cidade, código, usuários_grupo, vagas, vendas_mes, status
  Ações: Suspender · Reativar · Ver detalhes
  Filtros: cidade, status, ordenar por score

MODERAÇÃO:
  Vagas denunciadas (quando implementar botão de denúncia)
  Usuários banidos
  Aprovação de novos empreendedores

FINANCEIRO:
  Receita por empreendedor (tabela)
  Taxa acumulada pendente de cobrança
  Botão "Cobrar taxa" → gera registro em commissions

MIGRATION: supabase/migrations/20260601400000_platform_config.sql
  CREATE TABLE platform_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
  )
  INSERT INTO platform_config VALUES
    ('growth_pct', '34', NOW()),
    ('fase_atual', '1', NOW()),
    ('taxa_plataforma_pct', '10', NOW()),
    ('taxa_gratis_dias', '90', NOW());

Não criar React Navigation — manter Expo Router.
```

---

## CHECKLIST FASE 2

Rodar após implementar todos os prompts:

```
MOEDAS:
□ Saldo aparece corretamente na tela de moedas
□ Extrato mostra transações com reason traduzido
□ Moedas bloqueadas mostram data de liberação
□ spendCoins bloqueia se saldo insuficiente
□ earnCoins credita corretamente

AVALIAÇÕES:
□ Botão "Avaliar" aparece no chat quando status='concluida'
□ Estrelas interativas com animação
□ Tópicos aparecem após selecionar nota
□ Avaliação salva em ratings
□ nota_media atualizada em users
□ +3 moedas para quem avaliou
□ +5 moedas para nota 5

OPORTUNIDADES FÍSICAS:
□ Feed de oportunidades carrega
□ Resgate debita moedas atomicamente
□ QR Code gerado com token único
□ Empresa consegue ler o QR e confirmar
□ Estoque decrementa ao resgatar
□ Token expirado mostra erro correto

PERFIL:
□ Foto de perfil sobe para Storage
□ Progresso do perfil calcula corretamente
□ +20 moedas ao completar 100%
□ Edição salva automaticamente

PREVIEW (CADASTRO INTERESSANTE):
□ Vagas demo aparecem para não autenticados
□ Tentar candidatar abre BottomSheet de cadastro
□ Contador de contratações anima ao montar
□ Links no choose-profile abrem as previews

UPGRADE DESTAQUE:
□ Comprar topo do grupo → jobs.destaque_nivel = 'grupo'
□ Feed mostra vaga no topo para usuários do grupo
□ Feed NÃO mostra no topo para usuários fora do grupo
□ Upgrade cidade → destaque_nivel = 'cidade'
□ Feed mostra no topo para TODOS da cidade
□ Expiração automática funciona (destaque_ate < NOW())

ADMIN:
□ Acesso bloqueado para não admin_master
□ Métricas carregam com dados reais
□ Termômetro salva em platform_config
```

---

## SCRIPT DE TESTE FASE 2

```
Criar src/tests/fase2-checklist.ts seguindo o mesmo padrão do fase1-checklist.ts.

Testar:
1. earnCoins +20 para userId de teste
   → verificar user_coins.balance = 20

2. spendCoins -10 para userId de teste
   → verificar balance = 10

3. spendCoins -20 quando balance = 10
   → verificar que retorna erro saldo_insuficiente e balance permanece 10

4. INSERT em ratings (nota 5)
   → verificar nota_media atualizada em users
   → verificar coin_transactions +5 para avaliado

5. INSERT em physical_opportunities (quantidade=5)
   → redeem_opportunity RPC (token único)
   → verificar quantidade_restante = 4
   → verificar coin_transactions spend
   → tentar resgatar de novo com mesmo user
   → verificar erro ou segundo resgate (depende da regra)

6. Verificar tabela platform_config existe
   → SELECT WHERE key='growth_pct' → deve existir

7. Limpeza de todos os dados de teste

Mesmo padrão: npm run test:fase2
Adicionar em package.json:
"test:fase2": "ts-node --project tsconfig.scripts.json --transpile-only src/tests/fase2-checklist.ts"
```

---

*Diária da Cidade — Prompts Fase 2*
*Cole um prompt por vez · Teste antes de avançar*
*"Trabalhe hoje. Contrate hoje. Perto de você."*
