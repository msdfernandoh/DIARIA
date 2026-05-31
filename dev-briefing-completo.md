# Diária da Cidade — Briefing Técnico Completo para Desenvolvimento
## Documento oficial para o desenvolvedor · versão 1.0

**Slogan:** "Trabalhe hoje. Contrate hoje. Perto de você."  
**Objetivo imediato:** Conectar profissionais e contratantes via diárias — rápido, gratuito, sem burocracia  
**Modelo de negócio:** Empreendedor regional com código único vende destaques e fica com 90%  
**Arquivos de referência visual:** pagina-principal.html · pagina-trabalhe-hoje.html · pagina-contrate-hoje.html · pagina-empreendedor-v3.html

---

## ÍNDICE

- [1. Visão geral do produto](#1-visão-geral-do-produto)
- [2. Stack tecnológica](#2-stack-tecnológica)
- [3. Páginas web — 4 páginas estáticas](#3-páginas-web)
- [4. Fase 1 — MVP do aplicativo](#4-fase-1-mvp-do-aplicativo)
- [5. Fase 2 — Moedas e engajamento](#5-fase-2-moedas-e-engajamento)
- [6. Fase 3 — Escala e monetização avançada](#6-fase-3-escala-e-monetização-avançada)
- [7. Banco de dados completo](#7-banco-de-dados-completo)
- [8. Regras de negócio críticas](#8-regras-de-negócio-críticas)
- [9. APIs e integrações](#9-apis-e-integrações)
- [10. Segurança e compliance](#10-segurança-e-compliance)
- [11. Cronograma e entregáveis](#11-cronograma-e-entregáveis)

---

## 1. VISÃO GERAL DO PRODUTO

### 1.1 O que é

Marketplace de trabalho por diária com três perfis de usuário distintos e um sistema de empreendedores regionais que operam ecossistemas locais com código próprio.

### 1.2 Os cinco perfis

| Perfil | Cor | O que faz |
|---|---|---|
| Empregado / profissional | Verde `#1D9E75` | Busca e se candidata a vagas |
| Empregador / contratante | Azul `#1557FF` | Publica vagas e contrata |
| Empreendedor / parceiro | Âmbar `#D97706` | Opera ecossistema local com código único |
| Admin Regional | Roxo `#7C3AED` | Gerencia múltiplas instâncias (Fase 3) |
| Admin Master | Coral `#D85A30` | Controle total da plataforma |

### 1.3 Princípio fundamental de visibilidade

**Todos os usuários veem todos os dados.** Nenhuma vaga ou candidato é ocultado. O que muda entre grupos é apenas a ordem de exibição no feed — quem pagou destaque aparece primeiro para usuários do seu grupo.

### 1.4 Fluxo mínimo que precisa funcionar no dia 1

```
Empregado cadastra → vê vagas → se candidata → chat → diária acontece
Empregador cadastra → publica vaga → recebe candidatos → chat → contrata
Empreendedor cadastra → recebe código → compartilha link → usuários entram no grupo
```

---

## 2. STACK TECNOLÓGICA

### 2.1 Recomendação principal (mais rápida para MVP)

```
Aplicativo:     React Native com Expo (iOS + Android simultâneo)
Backend/DB:     Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions)
Notificações:   Expo Push Notifications + Firebase FCM
Chat:           Supabase Realtime (WebSocket nativo)
Mapas:          React Native Maps + Google Maps API
CEP/endereço:   ViaCEP API (gratuita)
Pix:            Sem gateway — exibir chave Pix do empreendedor na tela
Hospedagem web: Vercel (páginas estáticas)
Domínio:        diaria.cidade.com.br
```

### 2.2 Alternativa no-code (mais barata, mais lenta para escalar)

```
Aplicativo:     FlutterFlow + Supabase
Limitação:      Lógica complexa de feed com 4 camadas pode ser difícil
Recomendação:   Usar só para MVP de validação, migrar depois
```

### 2.3 Estrutura de repositórios

```
/diaria-cidade
  /app              → React Native (Expo)
  /web              → Páginas estáticas (HTML já criadas)
  /supabase
    /migrations     → SQL de criação do banco
    /functions      → Edge Functions (cron, webhooks)
    /seed           → Dados iniciais para testes
```

### 2.4 Variáveis de ambiente necessárias

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
GOOGLE_MAPS_API_KEY=
EXPO_PROJECT_ID=
FIREBASE_SERVER_KEY=
ZAPIER_WEBHOOK_URL=      # para formulários das páginas web
```

---

## 3. PÁGINAS WEB

### 3.1 Visão geral

São 4 páginas HTML estáticas já criadas e entregues como referência visual. O desenvolvedor deve:

1. Hospedar na Vercel ou Netlify
2. Conectar os formulários a um webhook (Zapier → Google Sheets → notificação WhatsApp)
3. Configurar domínios e subdomínios
4. Adicionar GA4 + Meta Pixel em todas as páginas

### 3.2 Páginas e URLs

| Arquivo | URL | Público-alvo |
|---|---|---|
| pagina-principal.html | diaria.cidade.com.br | Triagem geral |
| pagina-trabalhe-hoje.html | diaria.cidade.com.br/trabalhe | Profissionais |
| pagina-contrate-hoje.html | diaria.cidade.com.br/contrate | Empregadores |
| pagina-empreendedor-v3.html | diaria.cidade.com.br/parceiro | Empreendedores |

### 3.3 Formulário de captação (páginas web)

Enquanto o app não existe, os formulários das páginas web captam leads manualmente.

**Fluxo:**
```
Usuário preenche formulário
→ POST para webhook do Zapier
→ Zapier salva no Google Sheets
→ Zapier dispara mensagem WhatsApp via Z-API
→ Admin recebe notificação e envia código manualmente
```

**Campos mínimos:**
```
nome (obrigatório)
celular WhatsApp (obrigatório)
cidade/estado (obrigatório)
email (opcional)
tipo de interesse (select)
```

**Mensagem automática de boas-vindas (WhatsApp):**
```
Oi, [nome]! 👋
Recebemos seu pedido para ser empreendedor do Diária da Cidade.
Em até 24h você receberá seu código personalizado aqui neste número.
Qualquer dúvida é só chamar!
— Equipe Diária da Cidade
```

### 3.4 Analytics e rastreamento

Instalar em todas as páginas:
```html
<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>

<!-- Meta Pixel -->
<script>fbq('init', 'PIXEL_ID');</script>
```

Eventos a disparar:
```javascript
// Clique no CTA principal
fbq('track', 'Lead');
gtag('event', 'cta_click', {page: 'parceiro'});

// Submissão do formulário
fbq('track', 'CompleteRegistration');
gtag('event', 'form_submit', {perfil: 'empreendedor'});
```

---

## 4. FASE 1 — MVP DO APLICATIVO

**Duração estimada:** 8 a 10 semanas  
**Objetivo:** Primeira diária acontecendo na cidade-piloto  
**O que inclui:** Cadastro completo dos 3 perfis, área admin do empreendedor, publicação de vaga com calendário, feed, candidatura e chat

---

### 4.1 AUTENTICAÇÃO

#### Cadastro por perfil

O onboarding é diferente para cada tipo de usuário. O tipo é definido na primeira tela após download.

**Tela 1 — Escolha do perfil**
```
[Quero trabalhar]    → fluxo empregado
[Quero contratar]    → fluxo empregador  
[Quero empreender]   → fluxo empreendedor
```

**Campos comuns a todos:**
```
nome_completo       TEXT NOT NULL
celular             TEXT UNIQUE NOT NULL  (formato: 11999990000)
senha               TEXT NOT NULL  (mínimo 8 caracteres)
cep                 TEXT  (9 caracteres com máscara)
cidade              TEXT  (preenchido automaticamente via ViaCEP)
estado              TEXT  (2 caracteres, preenchido automaticamente)
lat / lng           DECIMAL  (geocodificado a partir do CEP)
aceite_termos       BOOLEAN  (obrigatório — com timestamp)
```

**Validações obrigatórias:**
```
celular → formato brasileiro válido
cep     → consulta ViaCEP antes de salvar
senha   → mínimo 8 caracteres, 1 número
aceite  → não pode avançar sem marcar
```

#### Termo de aceite — implementação

O termo aparece como modal antes do botão de criar conta. O usuário lê (ou não) e marca:

```
☐ Li e aceito os Termos de Uso
   [↗ Ler completo]  ← abre webview com o texto

☐ Li e aceito a Política de Privacidade
   [↗ Ler completo]

☐ Entendo que pagamentos são feitos entre as partes
   (o app não intermedia pagamentos)

[Para empreendedor apenas:]
☐ Li e aceito o Contrato de Parceiro
   [↗ Ler completo]
```

Salvar no banco:
```sql
termo_aceito_em     TIMESTAMP  -- quando clicou em aceitar
termo_versao        TEXT       -- ex: 'v1.0' para controle de versão
ip_aceite           TEXT       -- IP do dispositivo (LGPD)
```

---

### 4.2 CADASTRO DO EMPREGADO (profissional)

#### Fluxo completo de onboarding (5 telas após autenticação)

**Tela 1 — Dados básicos** (campos comuns acima)

**Tela 2 — Tipo de trabalho**
```
[toggle] Trabalho presencial / local
[toggle] Home Office / Remoto
[toggle] Ambos  ← padrão ativado
```

**Tela 3 — Habilidades** (grid de chips, máximo 6 selecionadas)
```
🧹 Diarista        🍽️ Garçom          🔨 Obras/Construção
🎉 Eventos         🌿 Zelador/Jardim   💻 T.I./Suporte
📞 Atendimento     🚗 Motorista        👴 Cuidador
📦 Mudanças        🖌️ Pintura          🍳 Cozinha
✍️ Redação/Texto   📸 Fotografia       🔌 Eletricista
```

**Tela 4 — Disponibilidade (calendário)**

Esta tela é central para o produto. Implementar com:

```
Componente: react-native-calendars (biblioteca Wix)

Modo de seleção: multi-date (múltiplos dias clicáveis)

Dias marcados = disponível (cor verde #1D9E75)
Dias não marcados = indisponível

Abaixo do calendário — seleção de turnos:
[☀️ Manhã]  [🌤 Tarde]  [🌙 Noite]  [🌃 Madrugada]

Raio de deslocamento:
Select: 5km · 10km · 20km · 50km · Sem limite

Tipo de disponibilidade:
○ Recorrente (toda semana assim)
○ Este mês apenas
```

Salvar em tabela separada:
```sql
user_availability (
  user_id         UUID FK users.id,
  dias_semana     INTEGER[]   -- 0=dom, 1=seg, ..., 6=sab
  datas_especificas DATE[]    -- datas específicas selecionadas
  turnos          TEXT[]      -- ['manha','tarde','noite','madrugada']
  raio_km         INTEGER DEFAULT 10,
  recorrente      BOOLEAN DEFAULT true,
  updated_at      TIMESTAMP
)
```

**Tela 5 — Código de empreendedor (opcional)**
```
Campo: "Tem um código de indicação?"
Input: texto com máscara maiúscula
Validação em tempo real: verificar se código existe no banco
Se válido: mostrar "✅ Código de [nome da instância] confirmado!"
Se inválido: "Código não encontrado. Pode continuar sem ele."
```

Ao usar um código válido:
- Usuário entra no grupo do empreendedor (`user_group`)
- Recebe bônus de boas-vindas (implementado na Fase 2)
- Empreendedor é notificado: "Novo usuário no seu grupo!"

**Tela 6 — Experiências profissionais (opcional, pular disponível)**
```
Lista de experiências com botão "Adicionar"

Cada experiência:
  cargo       TEXT
  empresa     TEXT
  periodo     TEXT  (ex: "Jan 2023 – Dez 2024")
  tipo        SELECT: presencial/remoto/híbrido
  descricao   TEXT  (textarea, max 200 chars)

Tópicos de destaque (chips selecionáveis):
  ✅ Pontual    🔒 Confiável    🧹 Organizado
  💬 Comunicativo    🚗 Tem transporte    💻 Sabe informática
```

**Tela 7 — Contato visível**
```
[toggle] Exibir celular para contratantes
         "Eles poderão ligar ou mandar WhatsApp diretamente"
         Padrão: desativado
```

---

### 4.3 CADASTRO DO EMPREGADOR (contratante)

#### Fluxo de onboarding (3 telas)

**Tela 1 — Dados básicos** (campos comuns)

**Tela 2 — Tipo de contratante**
```
○ Pessoa física (família, residência)
○ MEI / Autônomo
○ Empresa (CNPJ)

Se empresa:
  razao_social    TEXT
  cnpj            TEXT (com validação de dígitos)
  nome_fantasia   TEXT
  segmento        SELECT: Restaurante · Eventos · Construção · Varejo · Saúde · Outro
```

**Tela 3 — Código de empreendedor (opcional)**
Mesmo componente do empregado.

---

### 4.4 CADASTRO DO EMPREENDEDOR

#### Fluxo de onboarding (6 telas)

**Tela 1 — Dados pessoais** (campos comuns)

**Tela 2 — Tipo de pessoa/empresa**
```
[MEI]  [CNPJ]  [Pessoa Física]

Campos condicionais:
  CPF / CNPJ     TEXT (com máscara e validação)
  nome_responsavel TEXT (se CNPJ)
```

**Tela 3 — Identidade da instância**
```
nome_instancia    TEXT  ex: "Diária Sinop", "Conecta Cuiabá"
                  Sugestão automática: "Diária [cidade]"

cor_principal     COLOR PICKER (6 opções predefinidas + personalizada)
                  Padrão: #1D9E75

logo_url          IMAGE UPLOAD (opcional)
                  Supabase Storage: /logos/{user_id}/logo.png
                  Resize automático: 200x200px
```

**Tela 4 — Chave Pix (obrigatório)**
```
tipo_pix    SELECT: CPF · CNPJ · Celular · E-mail · Chave aleatória
chave_pix   TEXT (com validação por tipo)
banco       TEXT (nome do banco/fintech)
nome_conta  TEXT (nome que aparece no Pix)

Mostrar preview: como vai aparecer para o cliente na hora de pagar
```

**Tela 5 — Termos de parceiro**
Mesmo componente de termos, com adição do "Contrato de Parceiro".

**Tela 6 — Boas-vindas e código**
```
Animação de celebração (confetti leve)
Exibir código gerado: [JOAO2025]
  Fonte grande, fundo âmbar, botão de copiar

Link de indicação: diaria.cidade.com.br/ref/JOAO2025
  Botão: Compartilhar (abre share nativo do dispositivo)

QR Code do link (gerar com biblioteca 'qrcode' ou similar)
  Botão: Salvar QR Code na galeria

Botão: "Ir para meu painel →"
```

#### Geração do código único

```javascript
// Edge Function Supabase
async function gerarCodigo(nome: string): Promise<string> {
  // Pega as 4 primeiras letras do nome + ano atual
  const base = nome.replace(/\s/g,'').toUpperCase().slice(0,4);
  const ano = new Date().getFullYear().toString().slice(2); // ex: '25'
  let codigo = base + ano; // ex: JOAO25
  
  // Verifica se já existe — se sim, adiciona número sequencial
  let tentativa = 1;
  while (await codigoExiste(codigo)) {
    codigo = base + ano + tentativa;
    tentativa++;
  }
  return codigo;
}
```

---

### 4.5 ÁREA ADMINISTRATIVA DO EMPREENDEDOR

Esta é a área mais importante para o negócio funcionar. Deve ser clara, motivadora e orientada à ação.

#### Estrutura de navegação (bottom tabs)

```
[📊 Painel]  [👥 Grupo]  [💰 Vendas]  [⚙️ Config]
```

---

#### Tab 1 — Painel (dashboard principal)

**Bloco A — Header com identidade**
```
Logo da instância (ou ícone padrão)
Nome da instância
Código: JOAO2025  [📋 Copiar]  [📤 Compartilhar]
Status: Ativo · Dia X de Y
```

**Bloco B — Meta do mês (componente central)**

Este bloco deve ser o mais visual e chamativo da tela:

```
TÍTULO: "Sua meta este mês"

Barra de vagas:
  Label: "Vagas ativas"  |  Valor: "8 / 10"
  ProgressBar animada (cor âmbar, bordas arredondadas)
  Cor muda:
    0-49%: vermelho
    50-79%: âmbar
    80-99%: azul
    100%: verde + animação

Barra de pessoas:
  Label: "Pessoas no grupo"  |  Valor: "42 / 100"
  Mesma lógica de cores

Contador de dias:
  "⏳ 18 dias restantes"
  Cor: verde se > 15 dias, âmbar se 8-15, vermelho se < 7

Porcentagem geral:
  Texto grande: "65% concluído"

Mensagem motivacional (muda por faixa):
  < 30%: "Você está começando! Compartilhe seu link agora."
  30-60%: "Bom progresso! Foque em trazer mais empresas."
  60-90%: "Quase lá! Mais um esforço e você bate a meta."
  > 90%: "Incrível! Você está quase conquistando a microfranquia!"
  100%: "🎉 Meta batida! Continue crescendo seu ecossistema."
```

**Bloco C — O que fazer HOJE (ações diárias)**

Gerado dinamicamente pela lógica de negócio:

```
TÍTULO: "Faça isso hoje"

3 a 5 cards de ação:
  Cada card:
    Ícone  |  Título da ação  |  Impacto estimado

Lógica de geração (backend):
  IF pct_vagas < 30%:
    → "Aborde 3 empresas locais com seu link" (+3 vagas estimadas)
    → "Entre em grupos de WhatsApp de empresários da cidade" (+variado)
  IF pct_pessoas < 30%:
    → "Compartilhe seu QR Code em 2 grupos de trabalhadores" (+10 pessoas)
    → "Poste seu link no Instagram com a hashtag #trabalheagora" (+variado)
  IF dias_restantes < 7 AND pct_geral < 80%:
    → "⚠️ URGENTE: faltam X dias. Intensifique o compartilhamento."
  SEMPRE:
    → "Verifique se novos usuários completaram o perfil" (ativa comissão)
    → "Responda perguntas de empresas no chat da plataforma"
```

**Bloco D — Receita do mês**
```
Receita bruta:      R$ 247,00
Taxa plataforma:    R$ 0,00  ← "Grátis por mais 78 dias"
Seu lucro:          R$ 247,00

[Ver histórico completo →]
```

**Bloco E — Termômetro da microfranquia**
```
TÍTULO: "Sua microfranquia vitalícia"

Barra vagas: X / 50
Barra pessoas: X / 300

Quando atingir ambas:
  Animação de desbloqueio
  Badge "Microfranquia conquistada 🏆"
  Notificação push de celebração
```

**Bloco F — Atalhos rápidos**
```
[📤 Compartilhar link]   [🔲 Meu QR Code]
[💰 Nova venda]          [👥 Ver meu grupo]
```

---

#### Tab 2 — Grupo (usuários vinculados ao código)

**Visão geral:**
```
Total no grupo: 42 pessoas
  Empregados: 28
  Empregadores: 14

Ativos (completaram perfil + fizeram 1 ação): 31
Inativos (cadastraram mas não avançaram): 11
```

**Lista de usuários:**
```
Filtros: [Todos] [Empregados] [Empregadores] [Ativos] [Inativos]

Card de cada usuário:
  Avatar (iniciais)
  Nome
  Tipo (empregado / empregador)
  Status (ativo / inativo)
  Data de entrada
  [Entrou há X dias]
  
  Para inativos: botão "Lembrar este usuário"
    → Dispara notificação push para o usuário
    → "Complete seu perfil e comece a usar o Diária da Cidade!"
```

**Usuários inativos — alerta:**
```
Card de aviso: "11 pessoas ainda não completaram o perfil.
Elas não contam para sua meta enquanto estiverem inativas."
[Notificar todos inativos]  ← limit: 1x por semana por usuário
```

---

#### Tab 3 — Vendas (financeiro)

**Resumo do mês:**
```
Vendas realizadas:    18 transações
Receita bruta:        R$ 1.240,00
Taxa plataforma (10%): R$ 0,00  ← ainda no período gratuito
Seu lucro:            R$ 1.240,00

Período gratuito: mais 78 dias
Após isso: plataforma cobra 10% quando acumular R$ 150 em taxa
```

**Registrar nova venda:**

Este é o fluxo central de monetização. O empreendedor vende para um cliente e registra no app:

```
PASSO 1 — Cliente
  Campo: Nome / empresa do cliente
  Campo: Celular do cliente

PASSO 2 — Produto
  Select dos produtos:
    [📌 Fixar vaga no topo]       R$ 19/semana
    [⭐ Fixar candidato]           R$ 9/semana
    [🏷️ Banner no grupo]          R$ 49/mês
    [💡 Card oportunidade]         R$ 79/mês
    [🍺 Oportunidade física]       R$ 19–99 (valor editável)

PASSO 3 — Valor e período
  Valor cobrado:  [input numérico editável]
  Período:        Select (1 semana / 2 semanas / 1 mês / 3 meses)
  
  Preview em tempo real:
    Receita bruta:    R$ 19,00
    Taxa (10%):       R$ 0,00  (grátis agora)
    Seu lucro:        R$ 19,00

PASSO 4 — Pagamento (tela que o cliente vê)
  Exibir a chave Pix do empreendedor com destaque
  Botão: [📋 Copiar chave Pix]
  Instrução: "Peça ao cliente para fazer o Pix de R$ [valor]"
  Botão: [✅ Confirmar pagamento recebido]
  
  Ao confirmar:
    → Registra a venda no banco
    → Ativa o destaque para o produto/cliente
    → Notifica o cliente: "Seu destaque foi ativado!"
    → Atualiza o painel do empreendedor
```

**Histórico de transações:**
```
Lista cronológica com:
  Ícone do produto
  Nome do cliente
  Valor
  Data
  Status (ativo / expirado / cancelado)

Filtros: [Todos] [Ativos] [Expirados] [Este mês]
```

---

#### Tab 4 — Configurações

```
INSTÂNCIA
  Nome da instância          [editar]
  Cor principal              [color picker]
  Logo                       [upload]
  Link público               diaria.cidade.com.br/ref/JOAO2025 [copiar]

PIX E FINANCEIRO
  Chave Pix                  [editar]
  Tipo de chave              [editar]
  Banco                      [editar]
  Ver extrato completo       [botão]

MINHA CONTA
  Nome completo              [editar]
  Celular                    [editar]
  E-mail                     [editar]
  Tipo de pessoa             (exibição apenas)
  CPF / CNPJ                 (exibição apenas)

INSTÂNCIA
  Status:                    Ativo
  Período gratuito:          até [data]
  [Gerenciar plano]

NOTIFICAÇÕES
  [toggle] Novo usuário no grupo
  [toggle] Meta em risco (< 7 dias)
  [toggle] Pagamento registrado
  [toggle] Venda expirada

SAIR DA CONTA
  [Sair]  [Excluir conta]
```

---

### 4.6 PUBLICAÇÃO DE VAGA (empregador) — com calendário

#### Fluxo em 4 etapas

**Etapa 1 — Informações básicas**
```
Título da vaga*         TEXT (max 80 chars)
Categoria*              SELECT com ícones:
                          🧹 Limpeza  🍽️ Gastronomia  🔨 Construção
                          🎉 Eventos  💻 T.I.  📞 Atendimento
                          🌿 Jardinagem  👴 Cuidados  🖌️ Pintura
                          📦 Logística  🔌 Elétrica  Outro

Tipo de vaga*           ○ Diária (data específica)
                        ○ Emprego fixo (CLT / PJ)
                        ○ Remoto / Home Office

Formato*                ○ Presencial
                        ○ Home Office
                        ○ Híbrido

Quantidade de vagas*    NUMBER (default: 1)

Valor por diária (R$)*  NUMBER
  Helper: "Valor médio para esta categoria: R$ 150–200"
```

**Etapa 2 — Calendário e horário**

Esta etapa varia conforme o tipo de vaga:

```
SE tipo = "Diária":
  Calendário (react-native-calendars)
    Modo: single ou multi-date
    Datas passadas: desabilitadas (cor cinza)
    Data selecionada: cor azul (#1557FF)
    
  Horário de início:   [TimePicker]  ex: 08:00
  Horário de fim:      [TimePicker]  ex: 17:00
  
  Recorrência (toggle):
    [toggle] Esta vaga se repete
    SE ativado:
      SELECT: Toda semana · Quinzenal · Todo mês
      Dias da semana:  [Dom] [Seg] [Ter] [Qua] [Qui] [Sex] [Sáb]
      Até quando:      DatePicker (data final da recorrência)

SE tipo = "Emprego fixo":
  Data de início:      DatePicker
  Tipo de contrato:    SELECT: CLT · PJ · Estágio · Aprendiz
  Carga horária:       SELECT: Full-time · Part-time · A combinar
  Salário:             NUMBER (mensal)

SE tipo = "Remoto":
  Mesma lógica do emprego fixo +
  [toggle] Aceita qualquer cidade do Brasil
```

**Etapa 3 — Detalhes e local**
```
Descrição*              TEXTAREA (max 500 chars)
                        Helper: "O que o profissional vai fazer?"

Requisitos              TEXTAREA (max 300 chars)
                        Helper: "O que é necessário para a vaga?"

Benefícios (opcional)   CHIPS selecionáveis:
                          🍽️ Refeição  👕 Uniforme  🚌 Vale-transporte
                          💰 Pagamento no dia  🏠 Acomodação

SE presencial:
  CEP do local*         TEXT (com máscara e busca ViaCEP)
  Endereço*             Preenchido automaticamente via ViaCEP
  Número                TEXT
  Complemento           TEXT (opcional)
  Ponto de referência   TEXT (opcional)
  
  Exibir mapa:          Google Maps estático mostrando o local

Urgência:               [toggle] Esta vaga é urgente
                        Aparece com badge 🔴 "Urgente" no feed
```

**Etapa 4 — Preview e publicação**
```
Mostrar preview do card como vai aparecer no feed

Escopo de publicação:
  ○ Meu grupo (grátis)
      Visível para usuários do código do empreendedor
  ○ Toda a cidade (upgrade — disponível na Fase 3)
      Aparece no topo para todos da cidade
  ○ Todo o estado (upgrade — disponível na Fase 3)

[Publicar vaga grátis]

Após publicar:
  → Notificação push para profissionais do grupo com a categoria
  → Vaga aparece no feed imediatamente
  → Card de confirmação: "Vaga publicada! Aguarde candidatos."
```

---

### 4.7 FEED DE VAGAS (empregado)

#### Lógica de ordenação (4 camadas de prioridade)

```sql
-- Query principal do feed
SELECT 
  j.*,
  u.nome as empregador_nome,
  AVG(r.nota)::DECIMAL(3,1) as empregador_nota,
  COUNT(r.id) as empregador_avaliacoes,
  calculate_distance(j.lat, j.lng, $user_lat, $user_lng) as distancia_km,
  CASE
    WHEN j.destaque_nivel = 'brasil' THEN 1
    WHEN j.destaque_nivel = 'estado' AND j.estado = $user_estado THEN 2
    WHEN j.destaque_nivel = 'cidade' AND j.cidade = $user_cidade THEN 3
    WHEN j.destaque_nivel = 'grupo' 
     AND j.destaque_grupo_id = $user_grupo_id THEN 4
    ELSE 5
  END as prioridade
FROM jobs j
JOIN users u ON u.id = j.empregador_id
LEFT JOIN ratings r ON r.avaliado_id = j.empregador_id
WHERE 
  j.ativa = true
  AND j.vagas_restantes > 0
  AND (j.cidade = $user_cidade OR j.formato = 'remoto')
  AND ($categoria IS NULL OR j.categoria = $categoria)
GROUP BY j.id, u.nome
ORDER BY 
  prioridade ASC,
  j.urgente DESC,
  j.criado_em DESC
LIMIT $limit OFFSET $offset;
```

**Regra anti-poluição:**

Não exibir mais de 3 itens com destaque consecutivos:

```javascript
function aplicarAntiPoluicao(vagas) {
  let consecutivoDestaque = 0;
  return vagas.reduce((acc, vaga) => {
    if (vaga.prioridade < 5) {
      consecutivoDestaque++;
      if (consecutivoDestaque > 3) {
        // Buscar próxima orgânica e inserir antes
        const proxOrgânica = vagas.find(v => v.prioridade === 5 && !acc.includes(v));
        if (proxOrgânica) { acc.push(proxOrgânica); consecutivoDestaque = 0; }
      }
    } else {
      consecutivoDestaque = 0;
    }
    if (!acc.includes(vaga)) acc.push(vaga);
    return acc;
  }, []);
}
```

#### Filtros do feed

```
Barra de busca:     texto livre (título, categoria, empresa)

Chips de filtro (scroll horizontal):
  [Todos] [⚡ Urgente] [🏠 Home Office] [📍 Presencial]
  [🧹 Limpeza] [🍽️ Gastronomia] [🔨 Construção] [🎉 Eventos]
  [💻 T.I.] [Mais...]

Filtro avançado (modal ao clicar em ícone):
  Distância máxima:    Slider 1–50km
  Valor mínimo:        Input numérico
  Valor máximo:        Input numérico
  Data específica:     DatePicker
  Avaliação mínima:    Select (1★ a 5★)
  Tipo de vaga:        Checkbox múltiplo
```

#### Card de vaga no feed

```
[📌 Patrocinado]  (se destaque pago — badge discreto cinza)

┌─────────────────────────────────────────┐
│ [ícone categoria]  Título da vaga       │
│                    Empresa · Cidade     │
│                                  R$XXX │
│                                  /dia  │
│                                         │
│ 📅 Data · ⏰ Horário · 📍 Xkm          │
│ ⭐ X.X (XX avaliações)  🔴 URGENTE     │
└─────────────────────────────────────────┘
```

---

### 4.8 DETALHE DA VAGA E CANDIDATURA

**Tela de detalhe:**
```
Hero com gradiente da cor do perfil do empregado (verde)
  Badge de categoria + formato (presencial/remoto)
  Título da vaga
  Nome da empresa · cidade · distância

Card de preço:
  Valor em destaque
  "pagamento combinado diretamente com o contratante"
  Badge urgente (se aplicável)

Grid 2x2:
  📅 Data    ⏰ Horário    ⏱ Duração    ⚠️ X vagas

Seção: Recorrência (se aplicável)
  Chips das datas recorrentes

Seção: Descrição

Seção: Requisitos (lista com bullets)

Seção: Benefícios (chips)

Seção: Local (se presencial)
  Mapa estático Google Maps
  Endereço completo

Seção: Sobre o contratante
  Avatar + nome + avaliação
  ⭐ X.X · XX avaliações · membro desde YYYY
  [Ver todas avaliações]

Rodapé fixo:
  [💬 Perguntar]  [Me candidatar — R$ XX 💼]
```

**Ao clicar em "Me candidatar":**
```
1. Verifica se já se candidatou (evitar duplicata)
2. Cria registro em applications
3. Abre chat automaticamente
4. Notifica o empregador: "Nova candidatura de [nome] para [vaga]"
5. Mostra tela de confirmação com status timeline
```

---

### 4.9 CHAT

**Regras:**
- Chat só abre após candidatura criada
- Um chat por candidatura (não por usuário)
- Histórico permanente (não apaga)
- Mensagens de voz: fase futura

**Interface:**
```
Header:
  Avatar + nome do outro lado
  Status: online / última vez ativo há X
  Botão de ligação (se celular visível)
  Card da vaga relacionada

Barra de contato compartilhado:
  "Compartilhar celular com este usuário"
  [toggle]
  Quando ativado:
    → Envia mensagem de sistema: "📱 [nome] compartilhou o celular"
    → Exibe o número para o outro lado

Área de mensagens:
  Bolhas direita (eu) / esquerda (outro)
  Timestamps
  Mensagens de sistema (candidatura aceita, confirmação, etc.)
  Status de leitura (✓ enviado, ✓✓ lido)

Input:
  Campo de texto
  Botão de envio
  Emoji picker (simples)
```

**Mensagens de sistema automáticas:**
```
"Candidatura enviada · [hora]"
"Candidatura aceita pelo contratante 🎉 · [hora]"
"Diária concluída · [data] · Avalie sua experiência →"
```

---

### 4.10 NOTIFICAÇÕES PUSH

**Implementação:**
```javascript
// Registrar token ao fazer login
const { data: token } = await Notifications.getExpoPushTokenAsync({
  projectId: process.env.EXPO_PROJECT_ID
});
// Salvar em user_push_tokens
```

**Catálogo de notificações:**

```
EMPREGADO:
  nova_vaga_compativel    "Nova vaga urgente: [cargo] em [empresa] — R$[valor]"
  candidatura_aceita      "[empresa] aceitou sua candidatura! Fale agora."
  mensagem_nova           "[nome] te mandou uma mensagem"
  inatividade_3dias       "Tem [X] vagas novas esperando por você"

EMPREGADOR:
  nova_candidatura        "[nome] · [X]★ se candidatou para [cargo]"
  vaga_vencendo           "Sua vaga de [cargo] vence em 24h"
  mensagem_nova           "[nome] te mandou uma mensagem"

EMPREENDEDOR:
  novo_usuario_grupo      "Novo usuário no seu grupo! Total: X"
  meta_em_risco           "⚠️ Meta em risco: [X] dias restantes"
  meta_batida             "🎉 Meta do mês batida! Parabéns, [nome]!"
  microfranquia           "🏆 Microfranquia conquistada! Seu negócio é vitalício."
  venda_registrada        "R$ [valor] confirmado no seu Pix!"
  venda_expirando         "Destaque de [cliente] vence em 24h"
```

---

## 5. FASE 2 — MOEDAS E ENGAJAMENTO

**Início:** Após 200 usuários ativos na plataforma  
**Duração estimada:** 6 semanas  
**Objetivo:** Fazer usuários voltarem e indicarem organicamente

---

### 5.1 SISTEMA DE MOEDAS

#### Tabelas necessárias

```sql
user_coins (
  user_id       UUID PRIMARY KEY FK users.id,
  balance       INTEGER DEFAULT 0 CHECK (balance >= 0),
  total_earned  INTEGER DEFAULT 0,
  updated_at    TIMESTAMP DEFAULT NOW()
)

coin_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID FK users.id,
  type          TEXT CHECK (type IN ('earn','spend')),
  amount        INTEGER NOT NULL,
  reason        TEXT NOT NULL,
  ref_id        UUID,
  bloqueado     BOOLEAN DEFAULT false,
  libera_em     TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW()
)
```

#### Regras de crédito

```
EMPREGADO:
  cadastro sem código:         20 moedas (bloqueadas 7 dias)
  cadastro com código válido:  100 moedas (bloqueadas 7 dias)
  perfil 100% completo:        20 moedas
  primeira candidatura:         5 moedas
  diária concluída + avaliação: 10 moedas
  avaliação 5★ recebida:        5 moedas
  avaliou o contratante:        3 moedas
  indicou empregado ativo:     50 moedas (credita quando indicado fica ativo)
  indicou empregador ativo:    80 moedas
  indicou empreendedor:       150 moedas
  streak 7 dias consecutivos:  15 moedas
  concluiu curso gratuito:     30 moedas

EMPREGADOR:
  cadastro sem código:         10 moedas (bloqueadas 7 dias)
  cadastro com código válido:  50 moedas (bloqueadas 7 dias)
  publicou primeira vaga:      15 moedas
  contratou via plataforma:    20 moedas
  avaliou profissional:         3 moedas
  indicou outro empregador:    60 moedas
```

#### Definição de "usuário ativo" para crédito de indicação

```
Empregado ativo =
  perfil_completo = true
  AND (candidaturas_count >= 1 OR diarias_concluidas >= 1)
  AND ultimo_acesso >= NOW() - INTERVAL '30 days'

Empregador ativo =
  vagas_publicadas_count >= 1
  AND ultimo_acesso >= NOW() - INTERVAL '30 days'
```

#### Uso de moedas

```
EMPREGADO:
  currículo no topo do grupo · 7 dias:     100 moedas
  badge verificado · 30 dias:               80 moedas
  candidatura express (prioridade):         30 moedas
  acesso a módulo de curso premium:         60 moedas
  boost de visibilidade · 24h:             50 moedas

EMPREGADOR:
  vaga em destaque no grupo · 7 dias:     200 moedas
  filtro avançado de candidatos · 30 dias: 150 moedas
  desbloquear contato direto (1 cand.):    40 moedas
```

#### Lógica de bloqueio de moedas de bônus

```javascript
// Edge Function chamada ao criar usuário com código
async function creditarBonusCadastro(userId, comCodigo) {
  const amount = comCodigo ? 100 : 20;
  const liberaEm = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // +7 dias
  
  await supabase.from('coin_transactions').insert({
    user_id: userId,
    type: 'earn',
    amount,
    reason: comCodigo ? 'bonus_codigo' : 'bonus_cadastro',
    bloqueado: true,
    libera_em: liberaEm
  });
  // NÃO atualizar o balance ainda — só liberar quando libera_em chegar
}

// Cron job diário: liberar moedas bloqueadas
async function liberarMoedasBloqueadas() {
  const { data: transacoes } = await supabase
    .from('coin_transactions')
    .select('*')
    .eq('bloqueado', true)
    .lte('libera_em', new Date().toISOString());
  
  for (const tx of transacoes) {
    await supabase.rpc('creditar_moedas', {
      p_user_id: tx.user_id,
      p_amount: tx.amount
    });
    await supabase.from('coin_transactions')
      .update({ bloqueado: false })
      .eq('id', tx.id);
  }
}
```

---

### 5.2 OPORTUNIDADES FÍSICAS (brindes com QR Code)

#### Tabelas

```sql
physical_opportunities (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id          UUID FK users.id,
  empreendedor_id     UUID FK users.id,
  titulo              VARCHAR(80) NOT NULL,
  descricao           TEXT,
  foto_url            TEXT,
  custo_moedas        INTEGER NOT NULL,
  quantidade_total    INTEGER NOT NULL,
  quantidade_restante INTEGER NOT NULL,
  escopo              TEXT DEFAULT 'grupo',
  grupo_id            UUID,
  local_nome          VARCHAR(100),
  local_endereco      TEXT,
  lat                 DECIMAL,
  lng                 DECIMAL,
  valida_ate          TIMESTAMP,
  ativa               BOOLEAN DEFAULT true,
  criado_em           TIMESTAMP DEFAULT NOW()
)

physical_redemptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oportunidade_id     UUID FK physical_opportunities.id,
  user_id             UUID FK users.id,
  moedas_gastas       INTEGER NOT NULL,
  qrcode_token        VARCHAR(64) UNIQUE NOT NULL,
  status              TEXT DEFAULT 'pendente',
  resgatado_em        TIMESTAMP DEFAULT NOW(),
  confirmado_em       TIMESTAMP,
  expira_em           TIMESTAMP,
  confirmado_por      UUID
)
```

#### Fluxo de resgate (operação atômica)

```sql
-- Função SQL para resgate seguro
CREATE OR REPLACE FUNCTION resgatar_oportunidade(
  p_user_id UUID,
  p_oportunidade_id UUID,
  p_token VARCHAR
) RETURNS JSON AS $$
DECLARE
  v_opp physical_opportunities;
  v_saldo INTEGER;
BEGIN
  -- Lock exclusivo para evitar double-spend
  SELECT * INTO v_opp 
  FROM physical_opportunities 
  WHERE id = p_oportunidade_id 
  FOR UPDATE;
  
  -- Verificar estoque
  IF v_opp.quantidade_restante <= 0 THEN
    RETURN '{"error": "Oportunidade esgotada"}'::JSON;
  END IF;
  
  -- Verificar validade
  IF v_opp.valida_ate < NOW() THEN
    RETURN '{"error": "Oportunidade expirada"}'::JSON;
  END IF;
  
  -- Verificar saldo de moedas
  SELECT balance INTO v_saldo FROM user_coins WHERE user_id = p_user_id;
  IF v_saldo < v_opp.custo_moedas THEN
    RETURN '{"error": "Saldo insuficiente"}'::JSON;
  END IF;
  
  -- Debitar moedas (atômico)
  UPDATE user_coins 
  SET balance = balance - v_opp.custo_moedas
  WHERE user_id = p_user_id;
  
  -- Reduzir estoque
  UPDATE physical_opportunities 
  SET quantidade_restante = quantidade_restante - 1
  WHERE id = p_oportunidade_id;
  
  -- Criar resgate
  INSERT INTO physical_redemptions (
    oportunidade_id, user_id, moedas_gastas, 
    qrcode_token, expira_em
  ) VALUES (
    p_oportunidade_id, p_user_id, v_opp.custo_moedas,
    p_token, NOW() + INTERVAL '48 hours'
  );
  
  -- Log da transação de moedas
  INSERT INTO coin_transactions (user_id, type, amount, reason, ref_id)
  VALUES (p_user_id, 'spend', v_opp.custo_moedas, 'oportunidade_fisica', p_oportunidade_id);
  
  RETURN '{"success": true}'::JSON;
END;
$$ LANGUAGE plpgsql;
```

#### QR Code — geração e leitura

```javascript
// Geração (app do usuário)
import QRCode from 'react-native-qrcode-svg';

const token = generateSecureToken(); // UUID + timestamp
const qrData = `diaria.cidade.com.br/qr/${token}`;

<QRCode value={qrData} size={220} />

// Leitura (app da empresa — câmera)
import { BarCodeScanner } from 'expo-barcode-scanner';

// Ao ler o QR:
const token = extractTokenFromUrl(qrData);
const result = await supabase.rpc('confirmar_resgate', { 
  p_token: token, 
  p_confirmado_por: empresaUserId 
});
```

---

### 5.3 AVALIAÇÕES

#### Fluxo de avaliação pós-diária

Disparado automaticamente quando:
- O empregador marca a candidatura como "concluída"
- Ou após 24h da data da diária (trigger automático)

```
TELA DE AVALIAÇÃO:
  Mostra o nome e foto da pessoa a ser avaliada
  
  Nota em estrelas (1 a 5)
  Click interativo: estrelas se iluminam conforme hover/toque
  
  Tópicos positivos (chips — selecionar os que se aplicam):
    ✅ Pontual    🔒 Confiável    💬 Comunicativo
    🧹 Caprichoso   🤝 Respeitoso   💰 Pagou no prazo [para empregador]
    
  Comentário livre (textarea, opcional, max 200 chars)
  
  [Enviar avaliação]
```

#### Exibição no perfil

```
Nota geral:  4.9
Estrelas:    ★★★★★ (exibição visual)
Total:       38 avaliações

Distribuição:
  5★  ████████████  34  (88%)
  4★  ██            4   (10%)
  3★                0
  2★                0
  1★                0

Tópicos mais citados:
  ✅ Pontual (35x)    🔒 Confiável (32x)    🧹 Caprichosa (28x)

Avaliações recentes (últimas 5):
  [avatar] Nome da empresa
  ★★★★★ · "Excelente! Voltarei a contratar."
  📍 Presencial · Cargo · Há 3 dias
```

---

## 6. FASE 3 — ESCALA E MONETIZAÇÃO AVANÇADA

**Início:** Após 3 cidades com empreendedores ativos gerando receita  
**Duração estimada:** 8 semanas  
**Objetivo:** Receita recorrente e expansão nacional

### 6.1 Upgrades de alcance

```
Destaque Cidade:   vaga aparece no topo para TODOS da cidade
                   Preço: R$49–R$199/mês (conforme categoria)
                   Empreendedor que vendeu: recebe 20% de repasse

Destaque Estado:   vaga aparece em todo o estado
                   Preço: R$149–R$499/mês
                   Repasse ao empreendedor: 25%

Destaque Brasil:   visibilidade nacional
                   Preço: R$499–R$999/mês
                   Repasse ao empreendedor: 30%
```

### 6.2 Filtro avançado de candidatos (pago)

```
Recurso pago: R$29–R$79/mês ou 150 moedas
Desbloqueia filtros adicionais:
  Nota mínima (ex: só candidatos com 4.5+)
  Número mínimo de diárias concluídas
  Ativo nos últimos X dias
  Tem transporte próprio
  Distância exata em km
  Disponibilidade por dia específico da semana
  Já trabalhou com minha empresa antes
```

### 6.3 Cursos e certificações

```
Catálogo de cursos da plataforma (criados pelo fundador)
Categorias: Diarista · Garçom · Cuidador · Atendente · Auxiliar Admin

Acesso:
  Gratuito: via moedas (60 moedas por módulo) ou código de empreendedor
  Pago: R$47–R$197 por curso completo

Empreendedor vende cursos:
  Comissão: 70–90% para o empreendedor
  Plataforma retém: 10–30%

Certificação:
  Ao concluir: opção de emitir certificado
  Custo: R$19–R$29 ou 200 moedas
  Badge aparece no perfil público
  Código único verificável: CERT-2025-00142
```

### 6.4 Cobrança da taxa de 10% (automatização)

```
Cron job mensal:
  Para cada empreendedor com taxa acumulada >= R$150:
    1. Calcular total de taxa acumulada
    2. Gerar boleto ou Pix de cobrança
    3. Enviar notificação: "Sua taxa de 10% é de R$ [valor]"
    4. Prazo de 7 dias para pagamento
    5. Após 7 dias sem pagamento: pausar novos destaques
    6. NÃO pausar usuários — apenas novos destaques
```

### 6.5 Admin Master (painel web)

```
URL: admin.diaria.cidade.com.br (acesso restrito)

Funcionalidades:
  Dashboard global: usuários, vagas, diárias, receita
  Gestão de empreendedores: lista, status, métricas, suspender
  Gestão de metas: definir e ajustar metas por empreendedor
  Termômetro: controle das fases de limitação (0-40%, 40-70%, etc.)
  Moderação: denúncias, conteúdo impróprio, banimentos
  Financeiro: receita por empreendedor, taxa acumulada, repasses
  Aprovar novos empreendedores
  Enviar comunicados (push para todos os usuários)
```

---

## 7. BANCO DE DADOS COMPLETO

### 7.1 Schema SQL completo

```sql
-- ══════════════════════════════════════════
-- USUÁRIOS
-- ══════════════════════════════════════════

CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome              VARCHAR(120) NOT NULL,
  celular           VARCHAR(20) UNIQUE NOT NULL,
  email             VARCHAR(120) UNIQUE,
  cep               VARCHAR(9),
  cidade            VARCHAR(80),
  estado            CHAR(2),
  bairro            VARCHAR(80),
  endereco          TEXT,
  lat               DECIMAL(10,7),
  lng               DECIMAL(10,7),
  tipo              TEXT NOT NULL CHECK (tipo IN (
                      'empregado','empregador','empreendedor',
                      'admin_regional','admin_master'
                    )),
  foto_url          TEXT,
  celular_visivel   BOOLEAN DEFAULT false,
  trabalha_presencial BOOLEAN DEFAULT true,
  trabalha_remoto   BOOLEAN DEFAULT false,
  ativo             BOOLEAN DEFAULT true,
  email_verificado  BOOLEAN DEFAULT false,
  termo_aceito_em   TIMESTAMP,
  termo_versao      TEXT DEFAULT 'v1.0',
  criado_em         TIMESTAMP DEFAULT NOW(),
  atualizado_em     TIMESTAMP DEFAULT NOW(),
  ultimo_acesso     TIMESTAMP DEFAULT NOW()
);

-- Disponibilidade do empregado
CREATE TABLE user_availability (
  user_id           UUID PRIMARY KEY FK REFERENCES users(id),
  dias_semana       INTEGER[] DEFAULT ARRAY[1,2,3,4,5],
  datas_especificas DATE[],
  turnos            TEXT[] DEFAULT ARRAY['manha','tarde'],
  raio_km           INTEGER DEFAULT 10,
  recorrente        BOOLEAN DEFAULT true,
  updated_at        TIMESTAMP DEFAULT NOW()
);

-- Experiências profissionais
CREATE TABLE user_experiences (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID FK REFERENCES users(id) ON DELETE CASCADE,
  cargo       VARCHAR(80) NOT NULL,
  empresa     VARCHAR(80),
  periodo     VARCHAR(40),
  tipo        TEXT CHECK (tipo IN ('presencial','remoto','hibrido')),
  descricao   TEXT,
  ordem       INTEGER DEFAULT 0,
  criado_em   TIMESTAMP DEFAULT NOW()
);

-- Habilidades do empregado
CREATE TABLE user_skills (
  user_id     UUID FK REFERENCES users(id) ON DELETE CASCADE,
  skill       VARCHAR(40) NOT NULL,
  PRIMARY KEY (user_id, skill)
);

-- Tópicos de destaque do empregado
CREATE TABLE user_highlights_tags (
  user_id     UUID FK REFERENCES users(id) ON DELETE CASCADE,
  tag         VARCHAR(40) NOT NULL,
  PRIMARY KEY (user_id, tag)
);

-- Tokens de push notification
CREATE TABLE user_push_tokens (
  user_id     UUID FK REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL,
  plataforma  TEXT CHECK (plataforma IN ('ios','android')),
  updated_at  TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, token)
);

-- ══════════════════════════════════════════
-- EMPREENDEDORES
-- ══════════════════════════════════════════

CREATE TABLE entrepreneurs (
  user_id             UUID PRIMARY KEY FK REFERENCES users(id),
  codigo              VARCHAR(10) UNIQUE NOT NULL,
  nome_instancia      VARCHAR(80),
  cor_principal       CHAR(7) DEFAULT '#1D9E75',
  logo_url            TEXT,
  pix_chave           VARCHAR(120),
  pix_tipo            TEXT CHECK (pix_tipo IN (
                        'cpf','cnpj','celular','email','aleatoria'
                      )),
  pix_banco           VARCHAR(60),
  pix_nome_conta      VARCHAR(80),
  tipo_pessoa         TEXT CHECK (tipo_pessoa IN ('pf','mei','cnpj')),
  documento           VARCHAR(20),
  periodo_gratis_fim  TIMESTAMP DEFAULT NOW() + INTERVAL '90 days',
  status              TEXT DEFAULT 'ativo' CHECK (status IN (
                        'ativo','em_risco','suspenso','encerrado'
                      )),
  meta_vagas          INTEGER DEFAULT 10,
  meta_pessoas        INTEGER DEFAULT 50,
  microfranquia       BOOLEAN DEFAULT false,
  microfranquia_em    TIMESTAMP,
  criado_em           TIMESTAMP DEFAULT NOW()
);

-- Grupo do empreendedor (usuários vinculados ao código)
CREATE TABLE user_group (
  user_id           UUID PRIMARY KEY FK REFERENCES users(id),
  empreendedor_id   UUID FK REFERENCES users(id),
  codigo_usado      VARCHAR(10) NOT NULL,
  vinculado_em      TIMESTAMP DEFAULT NOW(),
  ativo             BOOLEAN DEFAULT true
);

-- Comissões e receita
CREATE TABLE commissions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empreendedor_id   UUID FK REFERENCES users(id),
  tipo              VARCHAR(60) NOT NULL,
  descricao         TEXT,
  valor_bruto       DECIMAL(10,2) NOT NULL,
  pct_empreendedor  DECIMAL(5,2) DEFAULT 90.00,
  valor_empreendedor DECIMAL(10,2),
  valor_plataforma  DECIMAL(10,2),
  taxa_acumulada    DECIMAL(10,2) DEFAULT 0,
  status            TEXT DEFAULT 'pendente',
  pago_em           TIMESTAMP,
  criado_em         TIMESTAMP DEFAULT NOW()
);

-- ══════════════════════════════════════════
-- VAGAS
-- ══════════════════════════════════════════

CREATE TABLE jobs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empregador_id       UUID FK REFERENCES users(id),
  titulo              VARCHAR(120) NOT NULL,
  descricao           TEXT,
  requisitos          TEXT,
  categoria           VARCHAR(60) NOT NULL,
  tipo                TEXT CHECK (tipo IN ('diaria','emprego_fixo','remoto')),
  formato             TEXT CHECK (formato IN ('presencial','remoto','hibrido')),
  contrato            TEXT CHECK (contrato IN ('clt','pj','estagio','aprendiz','diaria')),
  data_inicio         DATE,
  data_fim            DATE,
  horario_inicio      TIME,
  horario_fim         TIME,
  recorrente          BOOLEAN DEFAULT false,
  dias_recorrencia    INTEGER[], -- 0=dom...6=sab
  recorrencia_ate     DATE,
  valor               DECIMAL(10,2),
  vagas_total         INTEGER DEFAULT 1,
  vagas_restantes     INTEGER DEFAULT 1,
  cep                 VARCHAR(9),
  cidade              VARCHAR(80),
  estado              CHAR(2),
  endereco            TEXT,
  lat                 DECIMAL(10,7),
  lng                 DECIMAL(10,7),
  urgente             BOOLEAN DEFAULT false,
  beneficios          TEXT[],
  destaque_nivel      TEXT DEFAULT 'organico' CHECK (destaque_nivel IN (
                        'organico','grupo','cidade','estado','brasil'
                      )),
  destaque_grupo_id   UUID,
  destaque_ate        TIMESTAMP,
  ativa               BOOLEAN DEFAULT true,
  pausada             BOOLEAN DEFAULT false,
  criado_em           TIMESTAMP DEFAULT NOW(),
  atualizado_em       TIMESTAMP DEFAULT NOW()
);

-- Candidaturas
CREATE TABLE applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          UUID FK REFERENCES jobs(id),
  candidato_id    UUID FK REFERENCES users(id),
  status          TEXT DEFAULT 'pendente' CHECK (status IN (
                    'pendente','aceita','recusada','concluida','cancelada'
                  )),
  mensagem_inicial TEXT,
  criado_em       TIMESTAMP DEFAULT NOW(),
  atualizado_em   TIMESTAMP DEFAULT NOW(),
  UNIQUE(job_id, candidato_id)
);

-- ══════════════════════════════════════════
-- CHAT
-- ══════════════════════════════════════════

CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID FK REFERENCES applications(id),
  sender_id       UUID FK REFERENCES users(id),
  texto           TEXT NOT NULL,
  tipo            TEXT DEFAULT 'texto' CHECK (tipo IN ('texto','sistema','celular_compartilhado')),
  lida            BOOLEAN DEFAULT false,
  criado_em       TIMESTAMP DEFAULT NOW()
);

-- ══════════════════════════════════════════
-- AVALIAÇÕES
-- ══════════════════════════════════════════

CREATE TABLE ratings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID FK REFERENCES applications(id),
  avaliador_id    UUID FK REFERENCES users(id),
  avaliado_id     UUID FK REFERENCES users(id),
  nota            INTEGER NOT NULL CHECK (nota BETWEEN 1 AND 5),
  topicos         TEXT[],
  comentario      TEXT,
  criado_em       TIMESTAMP DEFAULT NOW(),
  UNIQUE(application_id, avaliador_id)
);

-- ══════════════════════════════════════════
-- DESTAQUES
-- ══════════════════════════════════════════

CREATE TABLE highlights (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_entidade       TEXT CHECK (tipo_entidade IN ('vaga','candidato','banner','oportunidade')),
  entidade_id         UUID,
  nivel               TEXT CHECK (nivel IN ('grupo','cidade','estado','brasil')),
  grupo_id            UUID,
  empreendedor_id     UUID FK REFERENCES users(id),
  valor_cobrado       DECIMAL(10,2),
  pago_via            TEXT DEFAULT 'pix',
  status_pagamento    TEXT DEFAULT 'pendente',
  ativo_de            TIMESTAMP DEFAULT NOW(),
  ativo_ate           TIMESTAMP,
  criado_em           TIMESTAMP DEFAULT NOW()
);

-- ══════════════════════════════════════════
-- MOEDAS (Fase 2)
-- ══════════════════════════════════════════

CREATE TABLE user_coins (
  user_id       UUID PRIMARY KEY FK REFERENCES users(id),
  balance       INTEGER DEFAULT 0 CHECK (balance >= 0),
  total_earned  INTEGER DEFAULT 0,
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE coin_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID FK REFERENCES users(id),
  type        TEXT CHECK (type IN ('earn','spend')),
  amount      INTEGER NOT NULL CHECK (amount > 0),
  reason      VARCHAR(60) NOT NULL,
  ref_id      UUID,
  bloqueado   BOOLEAN DEFAULT false,
  libera_em   TIMESTAMP,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ══════════════════════════════════════════
-- OPORTUNIDADES FÍSICAS (Fase 2)
-- ══════════════════════════════════════════

CREATE TABLE physical_opportunities (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id          UUID FK REFERENCES users(id),
  empreendedor_id     UUID FK REFERENCES users(id),
  titulo              VARCHAR(80) NOT NULL,
  descricao           TEXT,
  foto_url            TEXT,
  custo_moedas        INTEGER NOT NULL,
  quantidade_total    INTEGER NOT NULL,
  quantidade_restante INTEGER NOT NULL,
  escopo              TEXT DEFAULT 'grupo',
  grupo_id            UUID,
  cidade              VARCHAR(80),
  estado              CHAR(2),
  local_nome          VARCHAR(100),
  local_endereco      TEXT,
  lat                 DECIMAL(10,7),
  lng                 DECIMAL(10,7),
  valida_ate          TIMESTAMP,
  ativa               BOOLEAN DEFAULT true,
  criado_em           TIMESTAMP DEFAULT NOW()
);

CREATE TABLE physical_redemptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oportunidade_id   UUID FK REFERENCES physical_opportunities(id),
  user_id           UUID FK REFERENCES users(id),
  moedas_gastas     INTEGER NOT NULL,
  qrcode_token      VARCHAR(64) UNIQUE NOT NULL,
  status            TEXT DEFAULT 'pendente' CHECK (status IN (
                      'pendente','confirmado','expirado','cancelado'
                    )),
  resgatado_em      TIMESTAMP DEFAULT NOW(),
  expira_em         TIMESTAMP DEFAULT NOW() + INTERVAL '48 hours',
  confirmado_em     TIMESTAMP,
  confirmado_por    UUID FK REFERENCES users(id)
);
```

### 7.2 Índices de performance

```sql
-- Feed de vagas (queries mais frequentes)
CREATE INDEX idx_jobs_feed ON jobs(cidade, ativa, destaque_nivel, urgente, criado_em DESC);
CREATE INDEX idx_jobs_grupo ON jobs(destaque_grupo_id, destaque_nivel, destaque_ate);
CREATE INDEX idx_jobs_estado ON jobs(estado, destaque_nivel, ativa);
CREATE INDEX idx_jobs_geo ON jobs USING GIST(point(lng, lat));

-- Candidaturas
CREATE INDEX idx_applications_job ON applications(job_id, status);
CREATE INDEX idx_applications_candidato ON applications(candidato_id, status);

-- Chat
CREATE INDEX idx_messages_application ON messages(application_id, criado_em DESC);
CREATE INDEX idx_messages_unread ON messages(application_id, lida) WHERE lida = false;

-- Grupo do empreendedor
CREATE INDEX idx_user_group_empreendedor ON user_group(empreendedor_id, ativo);

-- Avaliações
CREATE INDEX idx_ratings_avaliado ON ratings(avaliado_id, nota, criado_em DESC);

-- Moedas
CREATE INDEX idx_coin_tx_user ON coin_transactions(user_id, created_at DESC);
CREATE INDEX idx_coin_bloqueadas ON coin_transactions(bloqueado, libera_em) WHERE bloqueado = true;
```

### 7.3 Row Level Security (RLS)

```sql
-- Usuários só veem seus próprios dados sensíveis
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_own ON users
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Vagas: qualquer autenticado pode ler, apenas o dono pode editar
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY jobs_read ON jobs FOR SELECT
  TO authenticated USING (ativa = true);
CREATE POLICY jobs_write ON jobs FOR ALL
  USING (auth.uid() = empregador_id);

-- Chat: apenas participantes da candidatura
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY messages_participants ON messages
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = application_id
      AND (a.candidato_id = auth.uid() OR 
           EXISTS(SELECT 1 FROM jobs j WHERE j.id = a.job_id AND j.empregador_id = auth.uid()))
    )
  );

-- Moedas: apenas o próprio usuário
ALTER TABLE user_coins ENABLE ROW LEVEL SECURITY;
CREATE POLICY coins_own ON user_coins USING (auth.uid() = user_id);
```

---

## 8. REGRAS DE NEGÓCIO CRÍTICAS

### 8.1 Visibilidade do feed

```
INVIOLÁVEL: Todo usuário SEMPRE vê todo o conteúdo.
Nunca ocultar vagas ou candidatos por falta de pagamento.
Apenas a POSIÇÃO no feed muda.
```

### 8.2 Destaque de grupo

```
Um destaque de grupo NUNCA aparece no topo para usuários de outro grupo.
Ambos veem a vaga — mas em posições diferentes.
Um destaque de cidade aparece no topo para TODOS da cidade.
```

### 8.3 Moedas

```
Moedas de bônus de cadastro: bloqueadas por 7 dias.
Crédito de indicação: SOMENTE quando o indicado for "ativo".
Transações de moeda são irreversíveis (não há estorno).
Saldo nunca pode ficar negativo (constraint no banco).
Moedas não têm valor monetário declarado (evitar regulação).
Moedas não podem ser transferidas entre usuários.
```

### 8.4 Resgate de oportunidade física

```
Resgate é atômico (SELECT FOR UPDATE).
Um token QR Code só pode ser confirmado UMA vez.
Tokens expiram em 48h automaticamente.
Moedas são devolvidas se o token expirar sem confirmação.
```

### 8.5 Empreendedor

```
Código é único e imutável após criação.
Um usuário pode pertencer a apenas UM grupo (um empreendedor).
Taxa de 10% é cobrada apenas após 90 dias de operação.
Cobrança só ocorre quando taxa acumulada >= R$150.
Suspensão por inadimplência: pausa novos destaques, NUNCA remove usuários.
Microfranquia vitalícia: quando vagas_ativas >= 50 E pessoas_ativas >= 300.
Após conquistar microfranquia: não perde o código por meta não batida.
```

---

## 9. APIs E INTEGRAÇÕES

### 9.1 ViaCEP (endereço por CEP)

```javascript
// Chamada ao usuário digitar o CEP
async function buscarCep(cep: string) {
  const cepLimpo = cep.replace(/\D/g, '');
  if (cepLimpo.length !== 8) return null;
  
  const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
  const data = await res.json();
  
  if (data.erro) return null;
  
  return {
    logradouro: data.logradouro,
    bairro: data.bairro,
    cidade: data.localidade,
    estado: data.uf,
    cep: data.cep
  };
}
```

### 9.2 Google Maps (geocoding e mapas estáticos)

```javascript
// Geocoding: converter endereço em lat/lng
async function geocodificar(endereco: string, cidade: string, estado: string) {
  const query = `${endereco}, ${cidade}, ${estado}, Brasil`;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  
  if (data.results.length === 0) return null;
  const { lat, lng } = data.results[0].geometry.location;
  return { lat, lng };
}

// Mapa estático para tela de detalhe da vaga
const mapaUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=360x180&markers=${lat},${lng}&key=${KEY}`;
```

### 9.3 Expo Push Notifications

```javascript
// Enviar notificação via Edge Function Supabase
async function enviarNotificacao(userId: string, titulo: string, corpo: string, data?: object) {
  const { data: tokens } = await supabase
    .from('user_push_tokens')
    .select('token')
    .eq('user_id', userId);
  
  const messages = tokens.map(t => ({
    to: t.token,
    title: titulo,
    body: corpo,
    data: data || {},
    sound: 'default',
    badge: 1
  }));
  
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messages)
  });
}
```

### 9.4 Zapier (formulários das páginas web)

```
Webhook URL: configurar no Zapier
Ação: POST com JSON dos campos do formulário
Zapier faz:
  → Adicionar linha no Google Sheets
  → Enviar WhatsApp via Z-API
  → Opcionalmente: criar usuário no Supabase via API
```

---

## 10. SEGURANÇA E COMPLIANCE

### 10.1 LGPD

```
Dado coletado → finalidade declarada no termo
Usuário pode solicitar exportação dos seus dados
Usuário pode solicitar exclusão da conta
Ao excluir: anonimizar dados (não apagar — preservar avaliações)
Log de aceite de termo: timestamp + versão + IP
Não vender dados para terceiros (declarar no termo)
```

### 10.2 Senhas e autenticação

```
Supabase Auth lida com hash de senha (bcrypt)
JWT token com expiração de 7 dias
Refresh token automático
Rate limiting: máximo 10 tentativas de login por hora por IP
2FA: não obrigatório no MVP, implementar na Fase 3
```

### 10.3 Upload de imagens

```
Storage: Supabase Storage (bucket 'avatars' e 'logos')
Resize automático antes de salvar: máximo 800x800px
Tipos aceitos: jpg, png, webp
Tamanho máximo: 5MB
CDN automático via Supabase Storage URL
```

### 10.4 Rate limiting de API

```
Feed de vagas: máximo 60 requisições por minuto por usuário
Chat: máximo 30 mensagens por minuto por usuário
Candidatura: máximo 10 candidaturas por hora por usuário
Registro de moedas: todas as operações validadas no banco (não no cliente)
```

---

## 11. CRONOGRAMA E ENTREGÁVEIS

### Fase 1 — MVP (10 semanas)

| Semana | Sprint | Entregável |
|---|---|---|
| 1–2 | Fundação | Banco de dados + autenticação + cadastro dos 3 perfis |
| 3–4 | Core empregador | Publicação de vaga com calendário + feed |
| 5–6 | Core empregado | Candidatura + detalhe da vaga + chat |
| 7–8 | Empreendedor | Código + painel + área admin + vendas |
| 9–10 | Destaques + testes | Feed com prioridade + notificações + QA |

**Critério de aceite da Fase 1:**
- [ ] Empregado consegue se cadastrar, ver vagas e se candidatar em menos de 5 minutos
- [ ] Empregador consegue publicar uma vaga com calendário e receber candidatos
- [ ] Empreendedor recebe código e vê o painel com meta e ações diárias
- [ ] Chat funciona em tempo real entre candidato e empregador
- [ ] Notificação push chega ao dispositivo em menos de 30 segundos
- [ ] Feed ordena corretamente por prioridade de destaque

### Fase 2 — Moedas e engajamento (6 semanas)

| Semana | Entregável |
|---|---|
| 11–12 | Sistema de moedas completo |
| 13–14 | Avaliações com estrelas e tópicos |
| 15–16 | Oportunidades físicas com QR Code |

**Critério de aceite da Fase 2:**
- [ ] Usuário ganha moedas por ação e vê o extrato
- [ ] Moedas de bônus de cadastro são liberadas após 7 dias
- [ ] Avaliação aparece no perfil com distribuição de estrelas
- [ ] Resgate de oportunidade física gera QR Code
- [ ] QR Code lido pela empresa baixa estoque atomicamente

### Fase 3 — Escala (8 semanas)

| Semana | Entregável |
|---|---|
| 17–18 | Upgrades de alcance (cidade, estado, brasil) |
| 19–20 | Cursos e certificações |
| 21–22 | Filtro avançado de candidatos |
| 23–24 | Painel admin master + financeiro automatizado |

---

## PERGUNTAS PARA ALINHAR ANTES DE COMEÇAR

Antes de iniciar o desenvolvimento, o desenvolvedor deve confirmar com o cliente:

**1.** Qual cidade é o piloto de lançamento? *(define configuração inicial do banco)*

**2.** Qual é o prazo desejado para ter a Fase 1 no ar? *(define se no-code ou dev customizado)*

**3.** Haverá moderação humana de conteúdo no início? *(define se precisa de painel de moderação no MVP)*

**4.** O link das vagas vai ter deep link para o app ou só abre a página web? *(define configuração do Expo)*

**5.** A página de vendas vai conectar diretamente ao cadastro do app ou ao formulário manual (Zapier)? *(define se precisa de API de criação de usuário nas páginas web)*

---

*Diária da Cidade — Briefing técnico completo v1.0*  
*"Trabalhe hoje. Contrate hoje. Perto de você."*  
*Dúvidas: contato direto com o fundador antes de iniciar qualquer sprint*
