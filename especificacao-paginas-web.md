# Diária da Cidade — Especificação técnica das 4 páginas web
## Documento para desenvolvimento front-end

**Slogan:** "Trabalhe hoje. Contrate hoje. Perto de você."  
**Páginas:** 4 arquivos HTML independentes, responsivos, mobile-first  
**Stack sugerida:** HTML5 + CSS3 + JavaScript vanilla, ou Next.js / Astro para SEO avançado  
**Hospedagem sugerida:** Vercel, Netlify ou GitHub Pages (todas gratuitas no plano básico)

---

## Índice

1. [Elementos compartilhados entre todas as páginas](#1-elementos-compartilhados)
2. [Página Institucional — diaria.cidade.com.br](#2-página-institucional)
3. [Página Trabalhe Hoje — /trabalhe](#3-página-trabalhe-hoje)
4. [Página Contrate Hoje — /contrate](#4-página-contrate-hoje)
5. [Página Abra sua Diária — /parceiro](#5-página-abra-sua-diária)
6. [Integrações necessárias](#6-integrações-necessárias)
7. [SEO e metadados](#7-seo-e-metadados)
8. [Analytics e rastreamento](#8-analytics-e-rastreamento)
9. [Checklist de entrega](#9-checklist-de-entrega)

---

## 1. Elementos compartilhados

Esses componentes aparecem em todas as 4 páginas e devem ser padronizados.

### 1.1 Fontes
```
Sora — títulos, botões, números de destaque
  Pesos: 400, 600, 700, 800
  Fonte: Google Fonts

Plus Jakarta Sans — corpo, parágrafos, labels
  Pesos: 300, 400, 500, 600, 700
  Fonte: Google Fonts
```

### 1.2 Paleta de cores global
```css
/* Perfis */
--verde:    #1D9E75  /* Empregado */
--verde-d:  #065F46
--verde-l:  #E1F5EE

--azul:     #1557FF  /* Empregador */
--azul-d:   #0A2A8F
--azul-l:   #E8EEFF

--ambar:    #D97706  /* Parceiro */
--ambar-d:  #92400E
--ambar-l:  #FFFBEB

--roxo:     #7C3AED  /* Admin Regional */
--coral:    #D85A30  /* Admin Master */

/* Neutros */
--dark:     #0A0D14
--mid:      #2D3748
--soft:     #718096
--line:     #E2E8F0
--bg:       #F8FAFB
--white:    #FFFFFF
```

### 1.3 Nav (navegação)
Comportamento padrão em todas as páginas:
- Posição: fixed, top 0, z-index 100
- Fundo: escuro com blur (`rgba(10,13,20,.85)` + `backdrop-filter: blur(14px)`)
- Altura: 60px
- Conteúdo esquerda: logo (ícone 📅 + nome "Diária da Cidade")
- Conteúdo direita: botão CTA adaptado por página
- Em scroll: mantém fixo com borda inferior sutil
- Mobile: sem menu hambúrguer — apenas logo + 1 botão CTA

| Página | Texto do botão nav |
|---|---|
| Institucional | "Começar grátis" |
| Trabalhe Hoje | "Cadastrar grátis" |
| Contrate Hoje | "Contratar grátis" |
| Abra sua Diária | "Quero ser parceiro" |

### 1.4 Footer
Padrão em todas as páginas:
- Fundo: `#060810`
- Logo + slogan em itálico
- Links internos: Quero trabalhar · Quero contratar · Ser parceiro
- Links legais: Termos de Uso · Privacidade · Contato
- Copyright: "© 2025 Diária da Cidade"
- Nota: "Gratuito para profissionais e contratantes"

### 1.5 Comportamentos globais
- **Scroll reveal:** elementos aparecem com fade + slide ao entrar na viewport
  - Biblioteca sugerida: `IntersectionObserver` nativo (sem dependência)
  - Delay: 0ms para mobile, 100ms escalonado para desktop
- **FAQ accordion:** clique abre/fecha resposta com animação suave
- **Botões hover:** `transform: translateY(-2px)` + sombra intensificada
- **Smooth scroll:** `scroll-behavior: smooth` no `:root`

---

## 2. Página Institucional

**URL:** `diaria.cidade.com.br` ou `/`  
**Propósito:** Triagem — visitante identifica seu perfil e vai para a página certa  
**Origem do tráfego:** busca orgânica, QR code, indicação, link de bio no Instagram  
**NÃO usar para anúncios pagos** — para isso, usar as páginas específicas

### 2.1 Seções em ordem

#### HERO
- Fundo: `#0A0D14` com gradiente mesh de 3 cores (azul, verde, roxo)
- Overlay: grid de linhas sutis `40px × 40px`
- Bolhas animadas com `filter: blur(60px)` em posições fixas
- Eyebrow badge com ponto verde pulsando (CSS `animation: pulse`)
- H1: "Diária" + "da Cidade" em gradiente azul→verde (clip-path)
- Slogan em itálico, cor suave
- **3 botões de perfil** — este é o único CTA do hero:
  - Verde: "Quero trabalhar" → `/trabalhe`
  - Azul: "Quero contratar" → `/contrate`
  - Âmbar: "Quero abrir minha Diária" → `/parceiro`
  - Cada botão: ícone + label + subtítulo + seta →
- 4 números de impacto em linha: R$0 · Hoje · Local · 🇧🇷

**Requisitos técnicos do hero:**
- `min-height: 100svh` (usar svh para mobile sem barra do browser)
- Bolhas com `position: absolute`, sem afetar scroll
- Botões de perfil com `border` semitransparente e hover com `background` mais saturado

---

#### PROBLEMA / SOLUÇÃO
- 3 cards em coluna
- Cada card: ícone grande + título da dor + texto do problema + solução em verde
- Fundo: `--bg` (#F8FAFB)

---

#### 3 PERFIS
- 3 cards verticais empilhados (mobile) / lado a lado 1 coluna em md
- Cada card tem gradiente próprio, bolhas decorativas internas, lista de features, botão para a landing page do perfil
- **Verde:** Empregado — link para `/trabalhe`
- **Azul:** Empregador — link para `/contrate`
- **Âmbar:** Parceiro — link para `/parceiro`

---

#### COMO FUNCIONA GERAL
- 6 steps verticais com número, título e descrição
- Separados por `border-bottom`
- Fundo `--bg`

---

#### MODELO DE NEGÓCIO
- Fundo: `--dark` (#0A0D14)
- 4 cards de produto com ícone, nome, descrição e valor
- Card extra explicando o fluxo de dinheiro
- Todos os textos em branco com opacidades

---

#### TERMÔMETRO DE CRESCIMENTO
- Fundo: `--dark` (continuação da seção anterior)
- Barra de progresso visual: atual 34%, gradiente verde
- Label percentual acima da barra com pseudoelemento `::after`
- 4 fases listadas abaixo da barra
- Fase atual destacada com `background` sutil verde
- Fases futuras com `opacity: 0.5`
- Card de aviso incentivando cadastro agora

---

#### MAPA DE CIDADES
- Grid 2 colunas de cards de cidade
- Estados: ativo (borda verde) / aberta (borda azul) / disponível (opacidade reduzida)
- Badge no canto de cada card indicando status
- Botão CTA ao final: "Abrir instância na minha cidade →" → `/parceiro`
- Fundo: `--white`

---

#### NÚMEROS DE IMPACTO
- Grid 2×2
- Fundo: gradiente escuro azul→verde
- Número grande + unidade + label descritivo
- Cards com fundo semitransparente e blur

---

#### MANIFESTO
- Fundo: `--dark`
- 1 card centralizado com gradiente interno sutil
- Citação em fonte grande
- 5 itens de princípio com ponto verde

---

#### FAQ GERAL
- 5 perguntas em accordion
- Fundo: `--bg`
- Respostas que cobrem todos os 3 perfis

---

#### CTA FINAL
- Fundo: `--dark` com bolha azul radial
- Os 3 botões coloridos de perfil novamente
- Slogan centralizado
- Nota pequena "Cadastro gratuito · Sem cartão · Sem burocracia"

---

### 2.2 Requisitos técnicos específicos

```
Animações:
- Ponto verde no hero: keyframe pulse (escala + opacidade)
- Scroll reveal: IntersectionObserver em todas as seções
- Hover nos cards de cidade: border-color + box-shadow

Performance:
- Fontes Google com preconnect e display=swap
- Imagens: nenhuma nesta versão (tudo CSS/emoji)
- Nenhuma dependência JavaScript externa

Acessibilidade:
- role="img" e aria-label nos ícones emoji usados como decoração
- Contraste mínimo 4.5:1 em todos os textos
- Links com texto descritivo (não usar "clique aqui")
- Focus visible nos elementos interativos
```

---

## 3. Página Trabalhe Hoje

**URL:** `/trabalhe` ou `trabalhe.diaria.cidade.com.br`  
**Propósito:** Converter visitantes em profissionais cadastrados  
**Cor dominante:** Verde (#1D9E75)  
**Tom:** Motivacional, direto, acessível  
**Origem do tráfego:** Anúncios pagos segmentados para quem busca renda extra

### 3.1 Meta do anúncio → página

| Anúncio | Público | Mensagem |
|---|---|---|
| Meta/Instagram | Pessoas 20–55 anos, sem emprego fixo | "Ganhe R$150–R$300 por diária" |
| Google | Busca "trabalho por diária [cidade]" | "Diárias disponíveis hoje perto de você" |

### 3.2 Seções em ordem

#### HERO
- Fundo: gradiente verde (`#065F46` → `#1D9E75` → `#34D399`)
- 3 bolhas decorativas com `border-radius: 50%` e `background: rgba(255,255,255,.07)`
- Nav: logo + botão "Cadastrar grátis"
- Eyebrow badge: "🟢 100% gratuito para profissionais"
- H1: "Trabalhe hoje. / Ganhe hoje. / Perto de você."
  - "Ganhe hoje." em cor mais clara (`#A7F3D0`)
- Subtítulo: 1 frase, max 20 palavras, sem jargão
- **2 CTAs:**
  - Principal (branco): "Quero trabalhar agora →" → link de cadastro
  - Secundário (transparente): "Ver como funciona" → âncora interna
- 3 números abaixo dos CTAs: R$150–R$300 / Hoje / R$0 de taxa
- **Wave SVG** separando hero do conteúdo

**Requisito do CTA principal:**
- Botão branco com texto verde escuro
- `font-size: 17px`, `padding: 18px`, `border-radius: 16px`
- `box-shadow` pronunciado
- Deve ser o elemento de maior contraste da tela

---

#### COMO FUNCIONA (âncora: #como-funciona)
- 5 steps verticais
- Cada step: número circular verde + título + descrição + badge de tempo
- Steps:
  1. Criar conta grátis — 2 minutos
  2. Escolher habilidades — 1 minuto
  3. Ver vagas disponíveis hoje — na hora
  4. Se candidatar em 1 toque — 10 segundos
  5. Trabalhar e receber no dia — mesmo dia
- Fundo: `--bg`

---

#### CATEGORIAS
- Grid 2 colunas, 8 cards
- Cada card: emoji + nome + faixa de valor diário
- Cards com hover sutil (border verde)
- Categorias: Diarista · Garçom · Ajudante de obra · Eventos · Atendente · Home Office · Zelador · Cuidador
- Fundo: `--white`

---

#### QUANTO VOCÊ PODE GANHAR
- Card grande com gradiente verde escuro
- 4 exemplos de ganho mensal com cálculo simples
- Card informativo branco: "Sem taxa para você"
- Fundo: `--bg`

---

#### DEPOIMENTOS
- 3 cards de depoimento
- Cada card: borda esquerda verde + aspas + texto + avatar + nome + cidade + estrelas
- Avatares: iniciais coloridas (sem foto real — usar quando houver usuários reais)
- Fundo: `--white`

---

#### FAQ
- 5 perguntas específicas para profissionais:
  1. É realmente gratuito?
  2. Como recebo o pagamento?
  3. Preciso de experiência formal?
  4. Posso trabalhar em home office?
  5. E se o contratante não pagar?
- Accordion com abertura/fechamento suave
- Fundo: `--bg`

---

#### CTA FINAL
- Fundo: gradiente verde (mesmo do hero)
- H2 + parágrafo + botão principal branco
- Nota: "Grátis para sempre · Cadastro em 2 minutos"

---

### 3.3 Requisitos técnicos específicos

```
Conversão:
- Botão CTA principal deve aparecer no viewport sem scroll (above the fold)
- Repetir o CTA ao menos 3 vezes na página (hero, meio, final)
- Formulário de cadastro: pode ser link externo para o app ou modal inline
- Se modal: pedir apenas nome + celular + cidade na primeira etapa

Rastreamento (ver seção 8):
- Evento de clique no CTA principal
- Evento de scroll até 50% e 100% da página
- Evento de abertura do FAQ
- UTM obrigatório: ?utm_source=meta&utm_medium=cpc&utm_campaign=trabalhe

Responsivo:
- Hero: fonte H1 reduz de 42px para 32px em telas < 360px
- Grid de categorias: 2 colunas fixas no mobile, 4 no desktop
- Botões: width 100% no mobile, max-width 340px centralizado
```

---

## 4. Página Contrate Hoje

**URL:** `/contrate` ou `contrate.diaria.cidade.com.br`  
**Propósito:** Converter visitantes em empregadores que publicam a primeira vaga  
**Cor dominante:** Azul (#1557FF)  
**Tom:** Profissional, confiável, eficiente  
**Origem do tráfego:** Anúncios pagos segmentados para empresas, eventos, residências

### 4.1 Meta do anúncio → página

| Anúncio | Público | Mensagem |
|---|---|---|
| Meta/Instagram | Donos de negócio, organizadores de eventos | "Encontre um garçom para amanhã — sem agência" |
| Google | Busca "contratar diarista [cidade]" | "Profissionais avaliados disponíveis hoje" |

### 4.2 Seções em ordem

#### HERO
- Fundo: gradiente azul (`#0A2A8F` → `#1557FF` → `#3B72FF`)
- Nav: logo + botão "Contratar grátis"
- Eyebrow badge: "🔵 Publicar vaga é gratuito"
- H1: "Contrate hoje. / Profissional na porta / em horas."
  - "Profissional na porta / em horas." em cor mais clara (`#BFDBFE`)
- Subtítulo: foco em resolver a urgência e a frustração com agências
- **2 CTAs:**
  - Principal (branco): "Publicar minha vaga agora →"
  - Secundário (transparente): "Ver como funciona"
- 3 números: 2h para contratar / ⭐ 4.8 de média / R$0 de taxa
- Wave SVG separando do conteúdo

---

#### O PROBLEMA QUE RESOLVEMOS
- 3 cards de dor + solução
- Tom empático — validar a frustração antes de vender
- Dores: urgência sem saída / medo de no-show / agência cara e lenta
- Cada dor: ícone + título + descrição + tag de solução em azul
- Fundo: `--bg`

---

#### COMO FUNCIONA
- 5 steps verticais (mesmo padrão, cor azul)
- Steps:
  1. Criar conta — 2 min
  2. Publicar a vaga — 3 min
  3. Receber candidatos com avaliações — em horas
  4. Falar pelo chat — minutos
  5. Pagar direto ao profissional — sem taxa
- Fundo: `--white`

---

#### PERFIS DE CANDIDATOS COM ESTRELAS
Esta é a seção mais importante desta página — demonstra o diferencial antes de contratar:
- 2 ou 3 cards de candidato de exemplo
- Cada card:
  - Avatar com iniciais coloridas
  - Nome + cidade + distância em km
  - Estrelas (número + count de avaliações)
  - Chips de tópicos positivos ("✅ Pontual 35x", "🔒 Confiável 32x")
  - Barra de progresso de "% recomendado"
- Texto introdutório: "Veja as estrelas antes de contratar"
- Fundo: `--bg`

**Requisito desta seção:**
- Os candidatos devem parecer reais — usar nomes regionais, distâncias plausíveis
- As estrelas devem ser interativas (hover muda cor) mesmo sendo decorativas
- Deixar espaço visual para quando houver candidatos reais do banco

---

#### QUANTO CUSTA
- Card principal: R$0 com lista de features incluídas
- Card secundário: destaque opcional R$19/semana
- Deixar claro: "Sem comissão sobre o contrato"
- Fundo: gradiente azul escuro (mesma cor do hero)

---

#### DEPOIMENTOS
- 3 cards
- Empresas e famílias reais (quando houver)
- Perfis: buffet de eventos / família / construtora
- Fundo: `--white`

---

#### FAQ
- 5 perguntas específicas para contratantes:
  1. Publicar é realmente grátis?
  2. Como funciona o pagamento ao profissional?
  3. E se o profissional não aparecer?
  4. Posso contratar para home office?
  5. Pessoa física pode contratar ou só empresa?

---

#### CTA FINAL
- Gradiente azul
- H2 + parágrafo + botão principal branco
- Urgência: "Seu profissional está aqui agora"

---

### 4.3 Requisitos técnicos específicos

```
Conversão:
- Fluxo de publicação de vaga deve ter no máximo 3 cliques após o CTA
- Se redirecionar para app: deep link direto para tela de publicar vaga
- Se formulário inline: título + categoria + data + valor + tipo (presencial/remoto)

Confiança:
- Número de avaliações e estrelas devem ser atualizados dinamicamente (API)
- Exibir "X vagas publicadas esta semana" se possível (dado real ou estimado no início)
- Selos de segurança discretos no footer da seção de pagamento

Rastreamento:
- UTM: ?utm_source=meta&utm_medium=cpc&utm_campaign=contrate
- Evento: clique no CTA, scroll 50%, abertura de FAQ, submissão de formulário
```

---

## 5. Página Abra sua Diária

**URL:** `/parceiro` ou `parceiro.diaria.cidade.com.br`  
**Propósito:** Converter empreendedores locais em parceiros ativos  
**Cor dominante:** Âmbar (#D97706)  
**Tom:** Oportunidade de negócio, independência financeira, simples de entender  
**Origem do tráfego:** Anúncios pagos para empreendedores, anúncios de renda extra, indicação de parceiros ativos

### 5.1 Meta do anúncio → página

| Anúncio | Público | Mensagem |
|---|---|---|
| Meta/Instagram | Empreendedores 25–50 anos, interesse em renda extra | "Abra seu app de vagas na sua cidade — de graça" |
| Google | Busca "franquia digital grátis" / "ganhar dinheiro online" | "Crie a Diária da sua cidade e ganhe 90% das vendas" |

### 5.2 Seções em ordem

#### HERO
- Fundo: gradiente âmbar (`#451A03` → `#92400E` → `#D97706`)
- Nav: logo + botão "Quero ser parceiro"
- Eyebrow badge: "💡 Modelo de negócio gratuito"
- H1: "Abra a / Diária / da sua cidade. / É de graça."
  - "Diária da sua cidade." em cor clara (`#FDE68A`)
- Subtítulo: foco no modelo de negócio e nos 90%
- **2 CTAs:**
  - Principal (branco): "Quero abrir minha Diária →"
  - Secundário: "Ver como funciona"
- 3 números: R$0 para começar / 90% das vendas / 3 meses grátis

---

#### O QUE VOCÊ RECEBE
- 6 cards de benefício em coluna
- Cada card: ícone + título + descrição
- Benefícios: link personalizado / logo e nome / Pix direto / 90% das vendas / painel de controle / banco nacional compartilhado
- Hover com borda âmbar
- Fundo: `--bg`

---

#### SIMULADOR DE GANHOS
Esta é a seção de maior conversão desta página:
- Card grande com gradiente âmbar escuro
- Tabela de exemplo conservador: 2 vagas fixadas + 1 banner + 3 candidatos fixados
- Linha de taxa (−10%)
- Total em destaque: "R$278 / mês com apenas 3 clientes"
- Card informativo sobre planos premium e repasse automático
- Fundo: `--white`

**Requisito desta seção:**
- O simulador deve ser INTERATIVO — o usuário pode ajustar o número de produtos vendidos e ver o resultado mudar em tempo real
- Campos: quantas vagas fixadas / quantos banners / quantos candidatos
- Resultado: calculado em JS no cliente, sem backend
- Mostrar sempre: valor bruto / taxa 10% / lucro líquido

```javascript
// Lógica do simulador
const precos = { vaga: 19, banner: 49, candidato: 9 };
const semanas = 4;

function calcular(vagas, banners, candidatos) {
  const bruto = (vagas * precos.vaga * semanas) 
              + (banners * precos.banner) 
              + (candidatos * precos.candidato * semanas);
  const taxa = bruto * 0.10;
  const liquido = bruto - taxa;
  return { bruto, taxa, liquido };
}
```

---

#### COMO FUNCIONA (passo a passo do parceiro)
- 5 steps
- Steps:
  1. Criar conta de parceiro — 5 min
  2. Receber link personalizado — instantâneo
  3. Divulgar na cidade — com sua rede
  4. Vender destaques para empresas locais — 90% é seu
  5. Cumprir meta e continuar grátis — simples
- Fundo: `--bg`

---

#### META GRATUITA — REGRAS SIMPLES
Seção dedicada a explicar as regras sem assustar:
- Card tabela: meta opção 1 / meta opção 2 / se não cumprir / dados dos usuários
- Comparativo visual lado a lado: "Meta cumprida = R$0" vs "Plano pago = R$29/mês"
- Tom: transparente e justo, não ameaçador
- Fundo: `--white`

---

#### DEPOIMENTOS
- 2 cards de parceiros reais
- Dados: nome + cidade + tipo de pessoa (MEI, PF)
- Tom: focado no resultado financeiro e na facilidade
- Fundo: `--bg`

---

#### FAQ
- 6 perguntas específicas para potenciais parceiros:
  1. Precisa ter CNPJ?
  2. Como ganho dinheiro?
  3. Posso ter mais de uma cidade?
  4. O que acontece se não cumprir a meta?
  5. A plataforma concorre comigo?
  6. Precisa saber de tecnologia?

---

#### CTA FINAL
- Gradiente âmbar
- H2: "Sua cidade está esperando por isso"
- Parágrafo: praticidade + gratuidade
- Botão principal branco
- Nota: "Gratuito por 3 meses · MEI, CNPJ ou pessoa física"

---

### 5.3 Requisitos técnicos específicos

```
Simulador interativo (obrigatório):
- Inputs do tipo range (slider) ou number para cada produto
- Atualização em tempo real sem recarregar a página
- Mostrar separado: bruto / taxa / líquido
- Limites dos sliders:
  vagas: 0–20, default 2
  banners: 0–5, default 1
  candidatos: 0–10, default 3

Formulário de parceiro:
- Campos: nome da instância + cidade + CEP + nome do responsável + celular + chave Pix + tipo (MEI/CNPJ/PF)
- Envio: para planilha Google Sheets via webhook (Zapier ou Make) enquanto não tiver backend
- Confirmação: mensagem inline + envio de WhatsApp automático

Rastreamento:
- UTM: ?utm_source=meta&utm_medium=cpc&utm_campaign=parceiro
- Evento: interação com simulador / preenchimento de formulário / submissão
```

---

## 6. Integrações necessárias

### 6.1 Formulários de cadastro (curto prazo)
Enquanto o app não estiver pronto, os CTAs das páginas de venda devem capturar o lead de forma simples:

**Opção A — Formulário inline (recomendado)**
```
Campos mínimos:
- Nome
- Celular (WhatsApp)
- Cidade / CEP

Destino:
- Google Sheets via Zapier ou Make
- Disparo automático de mensagem de boas-vindas no WhatsApp (via Z-API ou Evolution API)
```

**Opção B — Link externo**
```
CTA aponta diretamente para o app (quando disponível)
Deep link: diaria.cidade.com.br/app/cadastro?perfil=empregado
```

### 6.2 WhatsApp de boas-vindas
Após cadastro em qualquer página:
```
Mensagem automática:
"Olá, [nome]! Bem-vindo à Diária da Cidade 🎉
Seu cadastro foi recebido.
Assim que o app estiver disponível na sua região, 
você será o primeiro a saber.
Qualquer dúvida, é só chamar aqui!"
```

### 6.3 Simulador de ganhos (página parceiro)
- Lógica pura em JavaScript, sem backend
- Ver código de referência na seção 5.2

### 6.4 FAQ accordion
- Puro HTML/CSS com um evento de clique em JS
- Sem jQuery, sem biblioteca externa

### 6.5 Analytics
Ver seção 8.

---

## 7. SEO e metadados

### 7.1 Tags obrigatórias em cada página

**Institucional:**
```html
<title>Diária da Cidade — Trabalhe hoje. Contrate hoje. Perto de você.</title>
<meta name="description" content="Plataforma gratuita de diárias e empregos informais. Encontre trabalho ou contrate profissionais avaliados na sua cidade hoje.">
<meta property="og:title" content="Diária da Cidade">
<meta property="og:description" content="Trabalhe hoje. Contrate hoje. Perto de você.">
<meta property="og:image" content="/og-image-institucional.png">
<meta property="og:type" content="website">
<link rel="canonical" href="https://diaria.cidade.com.br">
```

**Trabalhe Hoje:**
```html
<title>Trabalhe Hoje — Diária da Cidade | Vagas de diária na sua cidade</title>
<meta name="description" content="Encontre diárias, bicos e empregos na sua cidade em minutos. Grátis. Sem taxa. Cadastre-se agora.">
```

**Contrate Hoje:**
```html
<title>Contrate Hoje — Diária da Cidade | Profissionais avaliados em horas</title>
<meta name="description" content="Publique sua vaga de diarista, garçom ou ajudante e receba candidatos avaliados em horas. Grátis para publicar.">
```

**Abra sua Diária:**
```html
<title>Seja Parceiro — Diária da Cidade | Abra seu app de vagas na sua cidade</title>
<meta name="description" content="Crie a Diária da sua cidade com link personalizado. Grátis por 3 meses. Venda destaques e fique com 90%.">
```

### 7.2 Schema markup (JSON-LD)
Adicionar na institucional:
```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Diária da Cidade",
  "description": "Plataforma gratuita de diárias e empregos informais no Brasil",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web, iOS, Android",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "BRL"
  }
}
```

### 7.3 Imagens OG
Criar uma imagem 1200×630px para cada página:
- Institucional: logo centralizada + slogan no fundo escuro com gradiente
- Trabalhe Hoje: fundo verde + "Trabalhe hoje. Ganhe hoje." em branco
- Contrate Hoje: fundo azul + "Contrate hoje. Profissional em horas." em branco
- Abra sua Diária: fundo âmbar + "Abra a Diária da sua cidade" em branco

---

## 8. Analytics e rastreamento

### 8.1 Ferramentas necessárias
```
Google Analytics 4 (GA4) — gratuito
Meta Pixel — obrigatório para anúncios no Instagram/Facebook
Google Tag Manager — para gerenciar sem mexer no código
```

### 8.2 Eventos a rastrear por página

**Todos as páginas:**
```javascript
// Scroll depth
25% → evento: scroll_depth_25
50% → evento: scroll_depth_50
75% → evento: scroll_depth_75
100% → evento: scroll_depth_100

// FAQ
Abertura de qualquer pergunta → faq_opened + {question: "texto da pergunta"}

// CTA clicado
Qualquer botão de CTA → cta_clicked + {label: "texto do botão", page: "nome da página"}
```

**Página Parceiro — simulador:**
```javascript
// Interação com o simulador
Qualquer mudança nos sliders → simulator_interaction + {vagas: N, banners: N, candidatos: N, resultado: R$}
```

**Formulários:**
```javascript
// Início do preenchimento
Foco no primeiro campo → form_started + {page: "nome"}

// Submissão bem-sucedida
Cadastro enviado → lead_submitted + {perfil: "empregado|empregador|parceiro", cidade: "nome"}
```

### 8.3 UTMs obrigatórios para anúncios
```
Página Trabalhe Hoje:
?utm_source=meta&utm_medium=cpc&utm_campaign=trabalhe-hoje&utm_content=renda-extra

Página Contrate Hoje:
?utm_source=meta&utm_medium=cpc&utm_campaign=contrate-hoje&utm_content=garcom-urgente

Página Parceiro:
?utm_source=meta&utm_medium=cpc&utm_campaign=parceiro&utm_content=abra-diaria
```

---

## 9. Checklist de entrega

### 9.1 Por página

| Item | Institucional | Trabalhe | Contrate | Parceiro |
|---|:---:|:---:|:---:|:---:|
| Nav fixo com blur | ✅ | ✅ | ✅ | ✅ |
| Hero com CTA acima do fold | ✅ | ✅ | ✅ | ✅ |
| Wave SVG separando hero | ✅ | ✅ | ✅ | ✅ |
| Scroll reveal nas seções | ✅ | ✅ | ✅ | ✅ |
| FAQ accordion funcional | ✅ | ✅ | ✅ | ✅ |
| CTA repetido no final | ✅ | ✅ | ✅ | ✅ |
| Footer com links internos | ✅ | ✅ | ✅ | ✅ |
| Metadados SEO completos | ✅ | ✅ | ✅ | ✅ |
| OG image configurada | ✅ | ✅ | ✅ | ✅ |
| GA4 + Meta Pixel instalados | ✅ | ✅ | ✅ | ✅ |
| Eventos de rastreamento | ✅ | ✅ | ✅ | ✅ |
| Formulário / CTA funcional | ✅ | ✅ | ✅ | ✅ |
| Responsivo 320px–1440px | ✅ | ✅ | ✅ | ✅ |
| Fonte Sora carregando | ✅ | ✅ | ✅ | ✅ |
| Contraste WCAG AA | ✅ | ✅ | ✅ | ✅ |
| Simulador interativo | ❌ | ❌ | ❌ | ✅ |
| Seção de candidatos com estrelas | ❌ | ❌ | ✅ | ❌ |
| Grid de cidades | ✅ | ❌ | ❌ | ❌ |
| Termômetro de crescimento | ✅ | ❌ | ❌ | ❌ |
| Perfis 3 cards grandes | ✅ | ❌ | ❌ | ❌ |

### 9.2 Testes antes de publicar

```
Performance:
□ Google PageSpeed Insights: mínimo 80 no mobile
□ Lighthouse: Performance, Accessibility, Best Practices, SEO
□ Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1

Funcional:
□ Todos os links internos funcionam
□ FAQ abre e fecha corretamente
□ Formulário envia e exibe confirmação
□ Simulador calcula corretamente (página parceiro)
□ Wave SVG renderiza sem lacunas
□ Scroll reveal funciona no iOS Safari

Cross-browser:
□ Chrome 120+
□ Safari 16+ (iOS e macOS)
□ Firefox 120+
□ Samsung Internet 23+

Resolucões:
□ 320px (iPhone SE)
□ 375px (iPhone 14 standard)
□ 390px (iPhone 15)
□ 414px (iPhone Plus)
□ 768px (iPad)
□ 1024px (iPad Pro / desktop pequeno)
□ 1440px (desktop padrão)
```

### 9.3 Ordem de desenvolvimento sugerida

```
Semana 1:
□ Design system em CSS (variáveis, tipografia, botões, cards)
□ Componentes compartilhados (nav, footer, FAQ accordion, scroll reveal)
□ Página institucional completa

Semana 2:
□ Página Trabalhe Hoje
□ Página Contrate Hoje

Semana 3:
□ Página Abra sua Diária com simulador interativo
□ Configuração de Analytics e Meta Pixel
□ Testes cross-browser e mobile

Semana 4:
□ Ajustes de performance (PageSpeed)
□ SEO e metadados
□ Publicação e testes em produção
□ Configuração de domínio e SSL
```

---

*Documento de especificação técnica — Diária da Cidade*  
*Para dúvidas sobre o design, consultar os arquivos HTML de referência:*  
*pagina-institucional.html · pagina-trabalhe-hoje.html · pagina-contrate-hoje.html · pagina-abra-sua-diaria.html*
