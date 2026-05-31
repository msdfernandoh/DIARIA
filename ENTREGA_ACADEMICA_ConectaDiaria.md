# Conecta Diária — Entrega Acadêmica Completa
## Design de Interação e Interface UX/UI

---

# 1. CONCEITO DO PRODUTO

**Conecta Diária** é um aplicativo mobile que funciona como um marketplace de trabalho temporário por diária. A plataforma conecta, em tempo real, dois públicos complementares:

- **Profissionais autônomos** que buscam renda extra com flexibilidade de horário e sem vínculo empregatício fixo
- **Contratantes** (empresas, eventos, residências) que precisam de mão de obra qualificada de forma ágil e confiável

O diferencial do produto está na **velocidade de conexão**: o profissional se candidata a uma vaga em menos de 3 cliques, e o contratante encontra trabalhadores disponíveis no mesmo dia. O app elimina intermediários, burocracia e longos processos seletivos para necessidades imediatas de mão de obra.

**Visão de produto:** "O trabalho certo, para a pessoa certa, no momento certo."

---

# 2. PROBLEMA QUE O APP RESOLVE

### Para o profissional:
- Dificuldade de encontrar trabalhos temporários de forma rápida e segura
- Falta de plataforma centralizada para este tipo de serviço informal
- Risco de não receber o pagamento combinado
- Ausência de histórico profissional que gere credibilidade

### Para o contratante:
- Dificuldade em contratar alguém confiável e de última hora
- Alto custo e burocracia de agências de emprego temporário
- Falta de transparência sobre o perfil e histórico do candidato
- Risco de no-show (profissional que confirma e não aparece)

### O gap de mercado:
O Brasil possui mais de **38 milhões de trabalhadores informais** (IBGE, 2023), muitos dependentes de diárias. Não existe, no mercado brasileiro, um app focado exclusivamente neste segmento com UX otimizada para usuários com baixa familiaridade digital.

---

# 3. PÚBLICO-ALVO

### Profissionais (usuário primário)
- **Perfil demográfico:** Mulheres e homens, 20–55 anos, classes C e D
- **Localização:** Regiões metropolitanas e cidades médias
- **Escolaridade:** Ensino médio completo ou incompleto
- **Situação:** Desempregados, subempregados, aposentados que buscam renda extra
- **Familiaridade digital:** Média-baixa. Usam WhatsApp e Instagram, mas têm dificuldade com apps complexos
- **Exemplos de persona:** Diaristas, garçons freelancers, ajudantes de obra, zeladores, cuidadores

### Contratantes (usuário secundário)
- **Perfil:** Pequenas e médias empresas, casas de festas, buffets, construtoras, famílias
- **Necessidade:** Cobertura emergencial, eventos pontuais, projetos de curta duração
- **Dor principal:** Urgência + confiabilidade + praticidade

---

# 4. PRINCIPAIS DORES DOS USUÁRIOS

## Dores do Profissional (mapeadas por pesquisa qualitativa)

| Dor | Impacto | Solução no App |
|-----|---------|----------------|
| "Não sei onde encontrar trabalho rápido" | Alto | Feed de vagas com filtros simples |
| "Tenho medo de não receber" | Alto | Sistema de avaliações + confirmação de pagamento |
| "Os processos são complicados" | Médio | Cadastro em 3 campos + candidatura em 1 clique |
| "Não tenho como comprovar minha experiência" | Médio | Histórico de diárias + avaliações acumuladas |
| "Fico sabendo tarde das oportunidades" | Alto | Notificações push em tempo real |

## Dores do Contratante

| Dor | Impacto | Solução no App |
|-----|---------|----------------|
| "Preciso de alguém para hoje" | Crítico | Filtro "urgente" + candidatos em até 2h |
| "Não sei se a pessoa vai aparecer" | Alto | Sistema de avaliação + confirmação por app |
| "Processo de pagamento é chato" | Médio | Pagamento guiado e registrado na plataforma |
| "Não tenho como avaliar o profissional antes" | Alto | Perfil com histórico, avaliações e fotos |

---

# 5. JORNADA DO USUÁRIO

## Jornada do Profissional — Fluxo principal

```
DESCOBERTA → ONBOARDING → BUSCA → CANDIDATURA → CONFIRMAÇÃO → EXECUÇÃO → AVALIAÇÃO
```

**Etapa 1 – Descoberta**
- Canal: indicação de amigos, busca no Google, redes sociais
- Estado emocional: esperançoso, ansioso por renda
- Ação: Baixa o app, abre pela primeira vez

**Etapa 2 – Onboarding (Telas 1, 2, 3)**
- Vê a Tela Inicial com proposta de valor clara
- Escolhe o perfil "Profissional"
- Realiza cadastro simples (nome, celular, habilidades, senha)
- Dor potencial: forms longos → solução: apenas 4 campos obrigatórios

**Etapa 3 – Busca (Tela 4)**
- Acessa o feed de diárias disponíveis
- Usa filtros por categoria ou urgência
- Vê informações essenciais nos cards: cargo, valor, data, localização

**Etapa 4 – Candidatura (Telas 5 e 6)**
- Abre os detalhes da diária
- Lê requisitos, horário, remuneração e perfil do contratante
- Toca em "Me candidatar" — um único botão
- Recebe confirmação imediata na tela

**Etapa 5 – Acompanhamento**
- Recebe notificação quando for selecionado
- Acessa o painel para ver status (pendente → confirmado)

**Etapa 6 – Execução e Avaliação**
- Realiza a diária
- Registra check-in e check-out pelo app
- Avalia o contratante; contratante avalia o profissional

---

# 6. FLUXO PRINCIPAL DE NAVEGAÇÃO

```
[Tela 1 – Splash/Inicial]
        ↓ "Começar agora"
[Tela 2 – Escolha de Perfil]
        ↓ Seleciona "Profissional" → "Continuar"
[Tela 3 – Cadastro Simples]
        ↓ Preenche dados → "Criar conta"
[Tela 4 – Feed / Lista de Diárias]
        ↓ Toca em uma vaga
[Tela 5 – Detalhes da Diária]
        ↓ "Me candidatar"
[Tela 6 – Confirmação + Painel do Usuário]
        ↓ "Ver mais diárias" → volta para Tela 4
```

**Fluxo alternativo (usuário já cadastrado):**
```
[Tela 1] → "Já tem conta? Entrar" → [Tela 4] → ...
```

**Fluxo do contratante (paralelo):**
```
[Tela 1] → [Tela 2 – perfil Contratante] → [Tela 3 – Cadastro] → [Painel Contratante] → [Publicar vaga]
```

---

# 7. ESTRUTURA DAS 6 TELAS

## Tela 1 – Tela Inicial (Splash / Landing)
**Objetivo:** Comunicar o valor do app de forma imediata e motivar o cadastro

**Componentes:**
- Logo + nome do app (Conecta Diária)
- Tagline: "Trabalho por diária para quem precisa de renda extra"
- Pills animadas com categorias (Diarista, Garçom, Obras)
- Botão primário: "Começar agora"
- Link secundário: "Já tem conta? Entrar"

**Decisão UX:** Fundo azul gradiente para transmitir confiança e profissionalismo. Sem carrossel ou tutorial — onboarding direto.

---

## Tela 2 – Escolha de Perfil
**Objetivo:** Segmentar o usuário e personalizar a experiência desde o início

**Componentes:**
- Cabeçalho com título e subtítulo
- Card "Sou Profissional" com ícone, descrição e tags de categorias
- Card "Sou Contratante" com ícone, descrição e tags
- Botão "Continuar" habilitado após seleção

**Decisão UX:** Cards grandes e táteis, fáceis de tocar. A seleção é visual (borda colorida) — sem radio buttons ou checkboxes que confundem usuários menos digitais.

---

## Tela 3 – Cadastro Simples
**Objetivo:** Coletar dados mínimos para criar a conta e personalizar vagas

**Componentes:**
- 4 campos agrupados: nome, celular, e-mail, cidade
- Grid de habilidades (chips selecionáveis)
- Campo de senha
- Botão "Criar conta grátis"
- Nota legal sobre termos de uso

**Decisão UX:** Campos agrupados em "cards" eliminam a sensação de formulário longo. Seleção de habilidades por chips visuais é mais intuitiva que dropdowns. Apenas 1 botão de ação — sem "cancelar" nem "limpar".

---

## Tela 4 – Lista de Diárias Disponíveis
**Objetivo:** Apresentar as oportunidades relevantes de forma escaneável e rápida

**Componentes:**
- Saudação personalizada + avatar
- Barra de busca
- Filtros horizontais por categoria
- Seção "Urgente" destacada no topo
- Cards de diárias com: cargo, empresa, localização, valor, data, horário
- Bottom navigation bar

**Decisão UX:** Urgentes sempre aparecem primeiro — atendem à principal dor do usuário (necessidade imediata). Cards são escaneáveis em 2 segundos: olho vai direto para título e valor.

---

## Tela 5 – Detalhes da Diária
**Objetivo:** Fornecer todas as informações necessárias para a decisão de candidatura

**Componentes:**
- Hero azul com categoria, título e empresa
- Card de preço com status de urgência
- Grid 2x2 com: data, horário, duração, vagas restantes
- Seção "Descrição da vaga"
- Seção "O que você vai precisar" (requisitos)
- Card do contratante com avaliação
- Botão CTA fixo no rodapé: "Me candidatar — R$ 180"

**Decisão UX:** O botão de candidatura permanece fixo no rodapé para ser sempre visível durante o scroll. O valor é repetido no botão para reforçar o benefício imediato.

---

## Tela 6 – Confirmação / Painel do Usuário
**Objetivo:** Confirmar a ação, gerar confiança e apresentar o painel de acompanhamento

**Componentes:**
- Cabeçalho verde com ícone de sucesso e mensagem de confirmação
- Card com resumo da candidatura
- Timeline de status (Enviada → Revisão → Confirmação → Pagamento)
- Painel com estatísticas pessoais (candidaturas, confirmadas, ganhos)
- Botões: "Ver mais diárias" e "Compartilhar meu perfil"

**Decisão UX:** A cor verde e o ícone de check são universalmente associados ao sucesso — eliminam dúvida sobre se a ação foi concluída. A timeline educa o usuário sobre o próximo passo, reduzindo ansiedade de espera.

---

# 8. TEXTOS DE CADA TELA (UX Writing)

## Tela 1
- **Título:** Conecta Diária
- **Tagline:** "Trabalho por diária para quem precisa de renda extra — rápido e simples."
- **CTA principal:** "Começar agora"
- **Link:** "Já tem conta? Entrar"

## Tela 2
- **Título:** "Como você vai usar o app?"
- **Subtítulo:** "Escolha seu perfil para personalizarmos sua experiência"
- **Card 1:** "Sou Profissional — Busco trabalho por diária para complementar minha renda com flexibilidade de horário"
- **Card 2:** "Sou Contratante — Preciso contratar profissionais por diária para meu negócio, evento ou residência"
- **CTA:** "Continuar →"

## Tela 3
- **Título:** "Criar sua conta"
- **Subtítulo:** "Leva menos de 2 minutos. Simples assim."
- **Placeholders:** "Ex: Maria Aparecida Silva", "(11) 99999-0000", "seu@email.com", "São Paulo, SP"
- **CTA:** "Criar conta grátis 🎉"
- **Nota:** "Ao criar, você concorda com os Termos de Uso e Política de Privacidade"

## Tela 4
- **Saudação:** "Olá, Maria 👋"
- **Título:** "Diárias disponíveis"
- **Seção 1:** "🔥 Urgente — precisam de você hoje"
- **Seção 2:** "📋 Próximas diárias"
- **Filtros:** Todos · Hoje · Limpeza · Eventos · Construção · Gastronomia

## Tela 5
- **Badge:** "Gastronomia"
- **Título:** "Garçom / Garçonete"
- **Descrição:** "Precisamos de garçons/garçonetes experientes para atender a um jantar corporativo com 80 convidados. Porte elegante e comunicação são essenciais. Uniforme fornecido pelo contratante."
- **CTA:** "Me candidatar — R$ 180 💼"

## Tela 6
- **Título:** "Candidatura enviada!"
- **Subtítulo:** "O contratante receberá seu perfil agora"
- **Timeline:** Candidatura enviada → Aguardando revisão → Confirmação → Pagamento
- **CTA:** "Ver mais diárias" / "Compartilhar meu perfil"

---

# 9. DECISÕES DE UX

## 9.1 Onboarding progressivo
Optou-se por um onboarding direto, sem telas de tutorial. O usuário aprende fazendo — a interface é autoexplicativa. A separação em 3 telas (splash → perfil → cadastro) evita sobrecarga cognitiva.

## 9.2 Candidatura em 1 clique
A decisão mais crítica de UX: após ver os detalhes, o usuário se candidata com um único toque. Não há formulário adicional, confirmação intermediária ou dados extras — o perfil já foi configurado no cadastro.

## 9.3 Hierarquia visual por urgência
Vagas urgentes aparecem sempre no topo do feed e possuem um badge vermelho. Isso atende à principal necessidade de ambos os lados: contratantes que precisam de alguém hoje e profissionais que querem ganhar ainda hoje.

## 9.4 Transparência de informações
Na tela de detalhes, todas as informações críticas estão visíveis antes da candidatura: valor exato, duração, requisitos e avaliação do contratante. Isso reduz desistência após confirmação e aumenta a confiança.

## 9.5 Feedback imediato
Após cada ação importante (seleção de perfil, candidatura), o app fornece feedback visual imediato: borda colorida nos cards selecionados, tela verde de confirmação, timeline de status.

## 9.6 Design inclusivo e acessível
- Textos de no mínimo 14px para leitura confortável
- Botões com altura mínima de 52px (área de toque adequada)
- Contraste de cor acima de 4.5:1 (WCAG AA)
- Linguagem simples, sem jargões técnicos
- Ícones acompanhados sempre de texto

## 9.7 Bottom Navigation
A barra de navegação inferior com 4 itens facilita o acesso às seções principais sem gestos complexos. Padrão iOS e Android reconhecido universalmente.

---

# 10. DECISÕES DE UI

## 10.1 Linguagem visual
Optou-se por um estilo **clean e funcional**, com elementos arredondados que transmitem acessibilidade e leveza. Não há elementos decorativos desnecessários.

## 10.2 Cards como unidade básica
Todos os conteúdos são apresentados em cards com sombra suave. Esta escolha:
- Separa visualmente informações diferentes
- Facilita o escaneamento
- Reduz a necessidade de separadores e linhas divisórias

## 10.3 Tipografia
- **Sora (Display):** Headings, títulos e CTAs — transmite modernidade e confiança
- **DM Sans (Body):** Textos corridos, labels e informações secundárias — ótima legibilidade em telas pequenas

## 10.4 Hierarquia de botões
- **Botão primário azul:** Ação principal única por tela
- **Botão outline:** Ações secundárias
- **Links de texto:** Ações terciárias (ex: "Já tem conta? Entrar")
- Regra: nunca mais de 2 botões por tela

## 10.5 Cores com semântica
- Azul (#1A6EF5): Ações, confiança, marca
- Laranja (#FF6B35): Urgência, destaque, segundo tipo de perfil
- Verde (#22C55E): Sucesso, confirmação positiva
- Vermelho (#DC2626): Urgência máxima, alertas

## 10.6 Espaçamento generoso
Padding interno de 18–24px em todos os cards. Espaçamento entre elementos de 12–16px. Texto nunca encosta nas bordas da tela — mínimo de 20px de margem lateral.

---

# 11. DESIGN SYSTEM BÁSICO

## 11.1 Paleta de Cores

### Cores primárias
| Token | Hex | Uso |
|-------|-----|-----|
| `--primary` | `#1A6EF5` | Ações principais, links, marca |
| `--primary-dark` | `#0F4FBF` | Hover, gradiente |
| `--primary-light` | `#EBF2FF` | Fundos de cards, chips selecionados |

### Cores de destaque
| Token | Hex | Uso |
|-------|-----|-----|
| `--accent` | `#FF6B35` | Urgência, perfil contratante |
| `--accent-light` | `#FFF0EB` | Fundo dos cards de contratante |
| `--success` | `#22C55E` | Confirmação, sucesso |
| `--success-light` | `#F0FDF4` | Fundo de estados positivos |

### Neutros
| Token | Hex | Uso |
|-------|-----|-----|
| `--text-900` | `#0D1117` | Títulos, texto principal |
| `--text-700` | `#374151` | Texto secundário |
| `--text-500` | `#6B7280` | Labels, subtítulos, placeholders |
| `--text-300` | `#D1D5DB` | Bordas, separadores |
| `--bg` | `#F5F7FA` | Background das telas |
| `--white` | `#FFFFFF` | Cards, superfícies |

---

## 11.2 Tipografia

### Família principal: Sora + DM Sans (Google Fonts — gratuito)

| Estilo | Família | Peso | Tamanho | Uso |
|--------|---------|------|---------|-----|
| Display XL | Sora | 800 | 32px | Nome do app, splash |
| H1 | Sora | 800 | 24px | Títulos de tela |
| H2 | Sora | 700 | 20px | Subtítulos principais |
| H3 | Sora | 700 | 16px | Títulos de card |
| Body Large | DM Sans | 400 | 16px | Textos de destaque |
| Body | DM Sans | 400 | 14px | Textos gerais |
| Caption | DM Sans | 600 | 12px | Labels, badges |
| Micro | DM Sans | 600 | 11px | Timestamps, notas |

**Line-height padrão:** 1.5 para body, 1.2 para headings
**Letter-spacing:** -0.5px em headings grandes, 0.8-1px em UPPERCASE labels

---

## 11.3 Botões

### Botão Primário (Solid Blue)
```
Background: #1A6EF5
Texto: White, Sora, 16px, 700
Padding: 18px 24px
Border-radius: 16px
Sombra: 0 4px 20px rgba(26,110,245,0.35)
Estado hover: translateY(-1px) + sombra mais intensa
Estado disabled: opacity 0.5, pointer-events none
```

### Botão Outline
```
Background: transparent
Borda: 2px solid #1A6EF5
Texto: #1A6EF5, DM Sans, 15px, 600
Padding: 16px 24px
Border-radius: 16px
Estado hover: background #EBF2FF
```

### Botão Primário Branco (para fundos escuros)
```
Background: #FFFFFF
Texto: #1A6EF5, Sora, 16px, 700
Padding: 18px 24px
Border-radius: 16px
Sombra: 0 4px 20px rgba(0,0,0,0.15)
```

**Regra de ouro:** Altura mínima de 52px em todos os botões (acessibilidade touch)

---

## 11.4 Cards

### Card Padrão (Diária)
```
Background: #FFFFFF
Border-radius: 16px
Padding: 18px
Sombra: 0 2px 12px rgba(0,0,0,0.08)
Borda selecionado: 1.5px solid #1A6EF5
Sombra hover: 0 8px 32px rgba(26,110,245,0.12)
Transição: all 0.2s ease
```

### Card de Perfil (Escolha)
```
Background: #FFFFFF
Border-radius: 24px
Padding: 28px 24px
Borda padrão: 2.5px solid transparent
Borda selecionado (profissional): #1A6EF5
Borda selecionado (contratante): #FF6B35
```

### Card de Informação (Info Box)
```
Background: #FFFFFF
Border-radius: 10px
Padding: 14px
Sombra: 0 2px 12px rgba(0,0,0,0.08)
```

---

## 11.5 Campos de Formulário

### Agrupamento em "Settings Style"
```
Container:
  Background: #FFFFFF
  Border-radius: 16px
  Overflow: hidden
  Sombra: 0 2px 12px rgba(0,0,0,0.08)

Campo individual:
  Padding: 14px 18px
  Border-bottom: 1px solid #F3F4F6
  Último item sem borda

Label (acima):
  Font: DM Sans, 11px, 600
  Color: #6B7280
  Text-transform: uppercase
  Letter-spacing: 0.5px

Input:
  Font: DM Sans, 15px, 400
  Color: #0D1117
  Background: transparent
  Border: none
  Outline: none
  Placeholder color: #D1D5DB
```

### Chips de Seleção (Habilidades)
```
Padrão:
  Background: #FFFFFF
  Border: 2px solid #D1D5DB
  Border-radius: 10px
  Padding: 12px
  Color: #374151
  Font: DM Sans, 13px, 500

Selecionado:
  Background: #EBF2FF
  Border: 2px solid #1A6EF5
  Color: #1A6EF5
```

---

## 11.6 Badges e Tags

### Badge Urgente
```
Background: #FEF2F2
Color: #DC2626
Font: DM Sans, 11px, 700
Padding: 3px 8px
Border-radius: 999px
```

### Category Badge
```
Background: rgba(255,255,255,0.2)
Color: white
Font: DM Sans, 12px, 600
Padding: 4px 12px
Border-radius: 999px
Backdrop-filter: blur(8px)
```

### Filter Chip
```
Padrão: White + borda #D1D5DB
Ativo: Background #1A6EF5, texto branco
Border-radius: 999px
Padding: 7px 16px
Font: DM Sans, 13px, 500
```

---

## 11.7 Espaçamentos (Grid System)

```
Base unit: 4px
Micro: 4px
Small: 8px
Medium: 12px
Default: 16px
Large: 24px
XL: 32px
XXL: 48px

Margem lateral mínima das telas: 20px
Padding interno de cards: 18px–24px
Gap entre cards: 12px
```

---

## 11.8 Ícones
- **Sistema:** Emojis nativos do sistema para máxima compatibilidade
- **Para versão final no Figma:** Phosphor Icons (gratuito) ou Heroicons
- **Tamanho padrão:** 20–24px em uso normal, 28–32px em destaques

---

## 11.9 Sombras (Elevation System)

```
Level 0: sem sombra (elementos em background)
Level 1: 0 2px 12px rgba(0,0,0,0.08) — cards padrão
Level 2: 0 8px 32px rgba(26,110,245,0.12) — cards em hover/foco
Level 3: 0 32px 80px rgba(0,0,0,0.22) — modal, phone frame
```

---

# 12. ORIENTAÇÃO PARA MONTAR NO FIGMA

## 12.1 Configuração inicial

1. **Crie um novo arquivo** no Figma (gratuito em figma.com)
2. **Configure o frame mobile:**
   - Frame → iPhone 14 Pro (390×844px) ou Custom 375×812px
   - Crie 6 frames lado a lado (um por tela)
3. **Instale as fontes:**
   - Abra fonts.google.com e baixe "Sora" e "DM Sans"
   - Ou use o plugin "Google Fonts" no Figma

## 12.2 Configurar Styles (Design System)

### Color Styles (Estilos de Cor)
1. Painel direito → **+** em "Local styles" → "Color"
2. Crie todos os tokens de cor listados na seção 11.1:
   - `Primary/Default` (#1A6EF5)
   - `Primary/Dark` (#0F4FBF)
   - `Primary/Light` (#EBF2FF)
   - `Accent/Default` (#FF6B35)
   - `Success/Default` (#22C55E)
   - `Text/900`, `Text/700`, `Text/500`, `Text/300`
   - `Background/Default` (#F5F7FA)
   - `White` (#FFFFFF)

### Text Styles
1. **+** em Text styles → crie um estilo para cada linha da tabela 11.2
2. Nome no formato: `Display/XL`, `Heading/H1`, `Body/Large`, etc.

### Effect Styles (Sombras)
1. Crie 3 estilos de efeito (Drop Shadow):
   - `Shadow/Level1`: 0 2px 12px, rgba(0,0,0,0.08)
   - `Shadow/Level2`: 0 8px 32px, rgba(26,110,245,0.12)

## 12.3 Criar Componentes

### Botões
1. Desenhe o botão primário (retângulo 320×52px, fill #1A6EF5, radius 16)
2. Adicione o texto centralizado (Sora, 16px, 700, branco)
3. Selecione tudo → **Create Component** (Ctrl+Alt+K)
4. Nomeie: `Button/Primary`
5. Adicione variantes: Default, Hover, Disabled, White

### Cards de Diária
1. Crie o card com AutoLayout (Shift+A)
2. Configure: Direction Vertical, Padding 18px, Gap 12px
3. Adicione os elementos internos como sub-frames
4. Transforme em componente com variantes: Default, Hover, Urgente

### Bottom Navigation
1. Crie o container (375×83px, branco, sombra Level2)
2. Adicione 4 ícones com labels usando AutoLayout
3. Componente com variante de item ativo

## 12.4 Montar as telas

### Tela 1 – Splash
1. Frame com fill gradiente (Linear: #0F4FBF → #1A6EF5, ângulo 160°)
2. Círculos decorativos: elipses com opacidade 6%, sem stroke
3. Logo: retângulo 90×90 arredondado, fill rgba(255,255,255,0.18)
4. Pills: capsule shape com fill rgba(255,255,255,0.15), stroke rgba(255,255,255,0.25)
5. Status bar: texto branco (9:41 | 📶🔋)

### Tela 2 – Perfil
1. Fundo #F5F7FA
2. Header: retângulo branco com sombra inferior sutil
3. Cards de perfil: use o componente criado, 2 instâncias

### Tela 3 – Cadastro
1. Scroll area (use o plugin "Content Reel" para simular scroll)
2. Agrupe campos em retângulos brancos arredondados
3. Grid de skills: 2 colunas, Auto Layout

### Tela 4 – Lista
1. Header fixo (Constraint: Top, Left+Right)
2. Cards de diária em lista vertical
3. Bottom Nav fixo (Constraint: Bottom, Left+Right)

### Tela 5 – Detalhes
1. Hero azul com gradiente
2. "Curva" no rodapé do hero: retângulo branco com radius top de 30px
3. Conteúdo em scroll sob o hero

### Tela 6 – Confirmação
1. Header verde com gradiente (#16A34A → #22C55E)
2. Ícone de sucesso: círculo com border semi-transparente
3. Timeline: linha vertical + dots + conteúdo lado a lado

## 12.5 Configurar Protótipo

1. Selecione o botão "Começar agora" na Tela 1
2. **Prototype** → arraste o nó para a Tela 2
3. Interaction: On Click → Navigate To → Tela 2
4. Animation: Smart Animate ou Slide In (from right)
5. Repita para todos os botões de navegação
6. Clique em **▷ Present** para testar o protótipo

## 12.6 Dicas finais para o Figma
- Use **AutoLayout** em todos os componentes para facilitar ajustes
- Mantenha **naming consistente**: Screen/01_Splash, Screen/02_Profile, etc.
- Use **Grids de 8px** para alinhar elementos (Shift+G para mostrar)
- Agrupe layers com nomes descritivos (evite Layer 1, Group 42)
- Use o plugin **Phosphor Icons** para ícones profissionais

---

# 13. README DO PROJETO

```markdown
# Conecta Diária — Protótipo UX/UI

## Sobre o projeto
Protótipo de alta fidelidade para o app mobile Conecta Diária, 
desenvolvido como entrega acadêmica da disciplina de Design de Interação e Interface.

## Estrutura do projeto

/conecta-diaria
├── conecta-diaria-prototype.html     → Protótipo navegável em HTML/CSS/JS
├── ENTREGA_ACADEMICA.md              → Documentação completa (este arquivo)
└── Figma (link)                      → [inserir link do arquivo Figma]

## Tecnologias do protótipo HTML
- HTML5 semântico
- CSS3 (variáveis, Grid, Flexbox, animações)
- JavaScript puro (sem frameworks)
- Google Fonts: Sora + DM Sans
- Responsivo para visualização desktop (simulando tela mobile 375px)

## Telas implementadas
1. Tela Inicial (Splash)
2. Escolha de Perfil
3. Cadastro Simples
4. Lista de Diárias
5. Detalhes da Diária
6. Confirmação + Painel

## Como usar o protótipo HTML
1. Abra o arquivo `conecta-diaria-prototype.html` em qualquer navegador moderno
2. Navegue entre as telas pelos botões no topo da página
3. Clique nos botões dentro do "celular" para navegar internamente
4. Interações disponíveis:
   - Seleção de cards de perfil (Tela 2)
   - Seleção de chips de habilidades (Tela 3)
   - Toque nos cards de vagas (Tela 4)

## Design System
Veja a seção 11 da documentação acadêmica para especificações completas de:
- Paleta de cores (com tokens CSS)
- Tipografia (Sora + DM Sans)
- Botões (4 variantes)
- Cards (3 tipos)
- Campos de formulário
- Badges e tags
- Sistema de sombras (3 níveis)

## Autoria
Desenvolvido para a disciplina de Design de Interação e Interface UX/UI
[Inserir: Aluno(a), RA, Turma, Instituição, Ano/Semestre]

## Fontes e referências
- IBGE: Pesquisa Nacional por Amostra de Domicílios (PNAD) 2023
- Nielsen Norman Group: Mobile UX Design Principles
- Google Material Design 3 Guidelines
- Apple Human Interface Guidelines (iOS)
- WCAG 2.1 — Web Content Accessibility Guidelines
```

---

# 14. FUNDAMENTAÇÃO TEÓRICA

## Design de Interação: Princípios Aplicados ao Conecta Diária

### 14.1 Introdução

O design de interação é uma disciplina que estuda e projeta a comunicação entre sistemas digitais e seres humanos, com o objetivo de criar experiências eficientes, eficazes e satisfatórias (PREECE, ROGERS e SHARP, 2019). No contexto de aplicativos móveis para o mercado de trabalho informal brasileiro, essa disciplina assume um papel social relevante: garantir que soluções tecnológicas sejam acessíveis a populações com diferentes graus de letramento digital.

O Conecta Diária foi projetado com base em três pilares teóricos principais: as heurísticas de usabilidade de Nielsen (1994), os princípios de design centrado no usuário (ISO 9241-210, 2019) e os conceitos de design inclusivo propostos por Mace et al. (1997).

### 14.2 Usabilidade e as Heurísticas de Nielsen

Jakob Nielsen (1994) propôs dez heurísticas para avaliar a usabilidade de interfaces. As principais aplicadas no Conecta Diária são:

**1. Visibilidade do status do sistema**
A timeline de candidatura na Tela 6 mostra claramente em qual etapa o usuário se encontra (enviado → revisão → confirmação → pagamento), eliminando a incerteza sobre o que acontecerá a seguir.

**2. Compatibilidade entre sistema e mundo real**
A linguagem do app é deliberadamente informal e coloquial: "Criar conta grátis 🎉", "Olá, Maria 👋", "Leva menos de 2 minutos. Simples assim." Isso reduz a distância cognitiva entre o app e o vocabulário do público-alvo.

**3. Controle e liberdade do usuário**
Toda tela possui um botão "Voltar", permitindo que o usuário desfaça ações sem penalidade. O fluxo não é linear e obrigatório — o usuário pode pular para o login direto na Tela 1.

**4. Consistência e padrões**
O sistema de design garante consistência visual: o mesmo padrão de cards, a mesma hierarquia tipográfica e os mesmos componentes aparecem em todas as telas.

**5. Prevenção de erros**
O cadastro usa campos com exemplos concretos nos placeholders ("Ex: Maria Aparecida Silva") e apresenta os campos em grupos lógicos, reduzindo erros de preenchimento.

**6. Reconhecimento em vez de lembrança**
As categorias de trabalho são apresentadas como chips visuais com emojis (🧹 Diarista, 🍽️ Garçom), facilitando o reconhecimento imediato em vez de exigir que o usuário memorize opções.

### 14.3 Design Centrado no Usuário (DCU)

A norma ISO 9241-210 (2019) define o Design Centrado no Usuário como um processo iterativo que coloca as necessidades, limitações e características dos usuários no centro do processo de design. Seguindo este processo:

**Fase de pesquisa:** Identificação das dores de profissionais e contratantes (Seções 3 e 4 deste documento)

**Fase de análise:** Mapeamento da jornada do usuário (Seção 5), identificando pontos de fricção no processo atual de busca de diárias (contato por grupos de WhatsApp, indicações informais, ausência de garantias)

**Fase de projeto:** Criação das 6 telas com decisões baseadas nas dores mapeadas — candidatura em 1 clique como resposta à urgência; cadastro mínimo como resposta à baixa familiaridade digital

**Fase de avaliação:** O protótipo HTML permite teste com usuários reais antes da implementação, seguindo o conceito de prototipagem rápida de Buxton (2007)

### 14.4 Design Inclusivo

O público-alvo do Conecta Diária inclui usuários com baixo letramento digital. Segundo o CETIC.br (2023), 39% dos usuários de internet no Brasil acessam exclusivamente pelo smartphone, e uma parcela significativa tem dificuldades com interfaces complexas.

As decisões de inclusão digital no projeto seguiram os princípios de Mace et al. (1997):

- **Uso equitativo:** A interface é igualmente utilizável por pessoas com diferentes graus de familiaridade digital
- **Uso simples e intuitivo:** Nenhuma funcionalidade requer mais de 3 toques para ser concluída
- **Tolerância ao erro:** O app não apaga dados inseridos ao voltar para telas anteriores; não há ações destrutivas sem confirmação
- **Baixo esforço físico:** Botões com altura mínima de 52px, adequados para pessoas com dificuldades motoras finas

### 14.5 Arquitetura da Informação

A estrutura de navegação segue o modelo de **hub-and-spoke** (Wodtke e Govella, 2009): o Feed de Diárias (Tela 4) funciona como hub central, a partir do qual o usuário acessa os detalhes de cada vaga (spokes). Esse modelo é ideal para apps de marketplace, pois reduz a profundidade hierárquica e mantém o usuário orientado.

A **bottom navigation bar** com 4 itens segue a recomendação de Nielsen Norman Group (2018): até 5 itens em navegação por abas; ícones sempre acompanhados de labels de texto; item ativo claramente destacado com cor diferente.

### 14.6 Psicologia Cognitiva Aplicada

**Lei de Hick:** O número de opções em cada tela foi limitado deliberadamente. Na escolha de perfil, apenas 2 opções; nos filtros de categoria, no máximo 6–7 chips visíveis. Quanto mais opções, maior o tempo de decisão (HICK, 1952).

**Lei de Miller:** O cadastro foi dividido em grupos de no máximo 4 campos por seção, respeitando a capacidade média de memória de trabalho humana de 7 ± 2 itens (MILLER, 1956).

**Efeito de posição serial:** Vagas urgentes aparecem no topo do feed (primacy effect), enquanto o botão de CTA principal é o último elemento antes do campo de visão inferior (recency effect), maximizando a probabilidade de toque.

### 14.7 Considerações Finais

O protótipo do Conecta Diária demonstra como princípios acadêmicos de design de interação podem ser aplicados a problemas concretos da realidade socioeconômica brasileira. A convergência entre usabilidade, inclusão digital e design centrado no usuário não é apenas um imperativo estético — é uma necessidade ética quando o produto serve a populações vulneráveis que dependem de renda imediata.

A validação deste protótipo com usuários reais (testes de usabilidade) constituiria a próxima etapa natural do processo, seguida de iterações com base nos dados coletados.

---

**Referências:**
- NIELSEN, J. (1994). *Usability Engineering*. Morgan Kaufmann.
- PREECE, J.; ROGERS, Y.; SHARP, H. (2019). *Interaction Design: Beyond Human-Computer Interaction*. Wiley.
- ISO 9241-210 (2019). *Ergonomics of human-system interaction*.
- MACE, R. L. et al. (1997). *The Principles of Universal Design*.
- MILLER, G. A. (1956). The magical number seven. *Psychological Review*, 63(2), 81–97.
- HICK, W. E. (1952). On the rate of gain of information. *Quarterly Journal of Experimental Psychology*, 4(1), 11–26.
- BUXTON, B. (2007). *Sketching User Experiences*. Morgan Kaufmann.
- CETIC.br (2023). *Pesquisa TIC Domicílios 2023*. CGI.br.
- Nielsen Norman Group (2018). *Mobile Navigation Patterns*.

---

# 15. ROTEIRO PARA PITCH DE VÍDEO (até 1 minuto)

## Estrutura do pitch (60 segundos)

---

**[0–8s] — Abertura impactante**
> *"No Brasil, 38 milhões de pessoas vivem de trabalhos informais. E toda semana, empresas e famílias perdem oportunidades por não conseguir contratar alguém confiável de última hora."*

*(Mostre a tela splash do app aberta no celular)*

---

**[8–20s] — O problema**
> *"Hoje, quem precisa de um garçom para o evento de amanhã, ou de uma diarista para esta semana, depende de grupos de WhatsApp, panfletos e indicações. Não existe uma solução rápida, segura e digital para isso."*

*(Gestos de frustração, buscas no celular sem resultado)*

---

**[20–40s] — A solução (demo do app)**
> *"Apresentamos o Conecta Diária."*
> *"Em 2 minutos, o profissional cria sua conta, seleciona suas habilidades e encontra vagas disponíveis para hoje."*
> *"Com um único toque, se candidata — e pode receber ainda no mesmo dia."*
> *"Do outro lado, o contratante publica uma vaga urgente e recebe candidatos qualificados em horas, não em dias."*

*(Navega ao vivo pelo protótipo: Tela 1 → 2 → 3 → 4 → 5 → 6)*

---

**[40–52s) — Diferenciais**
> *"Interface simples, pensada para quem não é especialista em tecnologia. Sem burocracia. Sem intermediários. Com avaliações que geram confiança para os dois lados."*

*(Mostre os cards, a candidatura, a tela de confirmação)*

---

**[52–60s] — Fechamento e call to action**
> *"Conecta Diária: o trabalho certo, para a pessoa certa, no momento certo."*
> *"[Inserir: nome, curso, instituição e semestre]*"*

*(Logo do app na tela, sorriso, postura confiante)*

---

## Dicas de gravação
- Use o celular em modo retrato para mostrar o app
- Grave em ambiente iluminado, fundo neutro
- Fale pausado e com clareza — 60s é rápido, mas não deve parecer correria
- Teste a demo ao vivo ou use uma gravação de tela editada
- Voz: confiante, entusiasmada, mas sem exagero
- Veste-se de forma sóbria (evita distração do conteúdo)
- Trilha sonora suave por baixo (opcional, se permitido pelo professor)

---

*Fin — Entrega Acadêmica Completa: Conecta Diária*
*Design de Interação e Interface UX/UI*
