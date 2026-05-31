# Diária da Cidade — Especificação técnica completa
## Documento para desenvolvedor · versão 3.0

**Slogan:** "Trabalhe hoje. Contrate hoje. Perto de você."  
**Prioridade máxima:** Diárias acontecendo o mais rápido possível  
**Modelo de crescimento:** Código de empreendedor + moedas + brindes físicos  
**Zero custo para empregados e empregadores — sempre**

---

## ÍNDICE

1. [Arquitetura geral](#1-arquitetura-geral)
2. [Sistema de códigos de empreendedor](#2-sistema-de-códigos-de-empreendedor)
3. [Matriz de visibilidade — a lógica do topo](#3-matriz-de-visibilidade)
4. [Sistema de moedas completo](#4-sistema-de-moedas-completo)
5. [Oportunidades físicas — brindes e experiências](#5-oportunidades-físicas)
6. [Produtos vendáveis pelo empreendedor](#6-produtos-vendáveis)
7. [Cursos e certificações](#7-cursos-e-certificações)
8. [Banco de dados — estrutura de tabelas](#8-banco-de-dados)
9. [Regras de negócio críticas](#9-regras-de-negócio-críticas)
10. [MVP — ordem de desenvolvimento](#10-mvp-ordem-de-desenvolvimento)

---

## 1. ARQUITETURA GERAL

### 1.1 Princípio fundamental
**Todos os usuários veem todos os dados.** Nenhum conteúdo é bloqueado. O que muda entre os grupos é apenas a **ordem de exibição** — quem aparece no topo depende de qual camada de destaque foi contratada.

### 1.2 Stack recomendada

```
Frontend mobile:    React Native (iOS + Android) ou Flutter
Frontend web:       Next.js (páginas de venda + painel admin)
Backend:            Node.js + Fastify ou Supabase (BaaS)
Banco de dados:     PostgreSQL (via Supabase ou Railway)
Autenticação:       Supabase Auth ou Firebase Auth
Storage:            Supabase Storage (fotos de perfil, logos)
Push notifications: Expo Push Notifications ou Firebase FCM
Chat:               Supabase Realtime ou Stream Chat
Pix:                Mercado Pago API ou Asaas (webhooks de confirmação)
No-code alternativo: FlutterFlow + Supabase (mais rápido para MVP)
```

### 1.3 Ambientes
```
Produção:  diaria.cidade.com.br
Staging:   staging.diaria.cidade.com.br
Dev local: localhost:3000
```

---

## 2. SISTEMA DE CÓDIGOS DE EMPREENDEDOR

### 2.1 O que é o código
Cada empreendedor recebe um código único alfanumérico no ato do cadastro. Ex: `JOAO2025`, `SINOPMKT`, `MARIA01`.

**Regras do código:**
- 6 a 10 caracteres, alfanumérico, sem espaço
- Único no sistema — não pode repetir
- Imutável após criação (evitar confusão em links compartilhados)
- Case-insensitive na busca (JOAO2025 = joao2025)
- Gerado automaticamente com sugestão editável no cadastro

### 2.2 Como o código é usado

**A) Link de indicação**
```
diaria.cidade.com.br/ref/JOAO2025
```
Quando alguém abre este link e se cadastra, o código é vinculado automaticamente ao perfil do novo usuário.

**B) Campo no cadastro**
Na tela de cadastro existe um campo opcional "Código de indicação". Se preenchido, o usuário entra na carteira do empreendedor.

**C) QR Code**
O painel do empreendedor gera um QR Code do seu link. Ele imprime, compartilha no WhatsApp, cola no carro, distribui no comércio local.

### 2.3 O que acontece quando alguém usa o código

```
PARA O USUÁRIO QUE USA O CÓDIGO:
  Empregado:
    + 100 moedas de bônus de boas-vindas (vs 20 sem código)
    + Currículo em destaque por 7 dias grátis
    + Acesso a 1 curso gratuito de bônus
    + Badge "Novo membro" por 30 dias

  Empregador:
    + 1 vaga em destaque grátis por 7 dias
    + Filtro avançado de candidatos por 30 dias grátis
    + 50 moedas de bônus
    + Suporte prioritário do empreendedor (WhatsApp direto)

PARA O EMPREENDEDOR:
  + 50 moedas por novo empregado ativo (completou perfil + candidatou em 1 vaga)
  + 80 moedas por novo empregador ativo (publicou 1 vaga)
  + Comissão em dinheiro quando esse usuário comprar qualquer produto pago
    - Produto comprado por usuário do seu grupo = 10% do valor vai para você
  + Contador no painel: "X usuários no seu grupo"
```

### 2.4 Tabela de vínculo de grupo

```sql
-- Usuário pertence ao grupo de qual empreendedor
user_group (
  user_id         UUID FK users.id,
  empreendedor_id UUID FK users.id,
  codigo_usado    VARCHAR(10),
  vinculado_em    TIMESTAMP,
  ativo           BOOLEAN DEFAULT true,
  PRIMARY KEY (user_id)  -- cada usuário tem apenas 1 empreendedor
)
```

**Regra:** o vínculo é definido no momento do cadastro e não pode ser alterado pelo usuário. Empreendedor não pode transferir usuários entre grupos.

### 2.5 Sem exclusividade territorial

Dois empreendedores podem operar na mesma cidade. O que diferencia é o tamanho do grupo de cada um. O usuário que não usou nenhum código fica no grupo "organico" (sem empreendedor vinculado) e não aparecer no topo de nenhum grupo privado — só nos destaques pagos de cidade/estado/brasil.

---

## 3. MATRIZ DE VISIBILIDADE

### 3.1 Princípio da ordem de exibição

O feed de vagas e a busca de candidatos seguem uma ordem de prioridade em camadas. O usuário **sempre vê todos os resultados** — o que muda é apenas a posição no topo.

```
ORDEM DE EXIBIÇÃO (de cima para baixo):

[CAMADA 4] Destaque Brasil
  → Vagas/candidatos que pagaram o plano nacional
  → Aparecem no topo para todos os usuários do Brasil

[CAMADA 3] Destaque Estado
  → Vagas/candidatos que pagaram o plano estadual
  → Aparecem após os nacionais

[CAMADA 2] Destaque Cidade
  → Vagas/candidatos que pagaram o plano cidade
  → Aparecem após os estaduais

[CAMADA 1] Destaque Grupo (do empreendedor)
  → Vagas/candidatos que pagaram destaque dentro de 1 grupo
  → Aparecem APENAS para usuários desse grupo
  → Para usuários de outros grupos, aparecem na posição orgânica

[ORGÂNICO] Todos os demais
  → Ordenados por: relevância + data + avaliação
  → Visível para todos
```

### 3.2 Regra crítica para o desenvolvedor

> Um destaque de **Grupo** não aparece no topo para usuários de **outros grupos**.  
> Um destaque de **Cidade** aparece no topo para **todos da cidade**, independente do grupo.

```
Exemplo:
  - João comprou destaque de GRUPO para sua vaga de garçom
  - Maria está no grupo de João → vê a vaga de João no topo
  - Carlos está no grupo de Ana (outro empreendedor) → não vê no topo, mas vê na lista orgânica
  - Pedro não tem grupo → não vê no topo de nenhum grupo

  - Empresa X comprou destaque de CIDADE
  - Todos da cidade (Maria, Carlos, Pedro) → veem no topo
```

### 3.3 Lógica da query de feed (pseudocódigo)

```sql
-- Feed de vagas para o usuário U
SELECT vagas.*,
  CASE
    WHEN destaque_brasil THEN 1
    WHEN destaque_estado AND estado = U.estado THEN 2
    WHEN destaque_cidade AND cidade = U.cidade THEN 3
    WHEN destaque_grupo AND grupo_id = U.grupo_id THEN 4
    ELSE 5
  END AS prioridade,
  -- dentro da mesma prioridade, ordena por relevância
  relevancia_score DESC,
  criado_em DESC
FROM vagas
WHERE ativa = true
  AND (cidade = U.cidade OR remoto = true)
ORDER BY prioridade ASC, relevancia_score DESC, criado_em DESC;
```

### 3.4 Upgrades de destaque (o que o empreendedor pode vender)

```
DESTAQUE GRUPO (produto base do empreendedor):
  Vaga no topo do grupo:      R$19/semana
  Candidato no topo do grupo: R$9/semana
  Banner no grupo:            R$49/mês

UPGRADE CIDADE (produto premium, parte vai à plataforma):
  Vaga no topo da cidade:      R$49–R$149/mês
  Candidato no topo da cidade: R$29–R$79/mês
  Banner cidade:               R$199/mês

UPGRADE ESTADO E BRASIL:
  Apenas via plataforma master
  Empreendedor que originou o cliente recebe repasse de 20–30%
```

### 3.5 Anti-poluição do topo

**Limite de slots por camada:**
- Máximo 3 vagas patrocinadas no topo antes das orgânicas
- Máximo 1 banner por tela
- Badge "Patrocinado" discreto (não chamativo) em destaque pago
- Usuário nunca vê mais de 3 itens consecutivos do mesmo patrocinador

---

## 4. SISTEMA DE MOEDAS COMPLETO

### 4.1 Tabela de ganho de moedas

```
EMPREGADO:
  Cadastro com código de empreendedor:   100 moedas (bônus)
  Cadastro sem código:                    20 moedas
  Completar perfil 100%:                 20 moedas
  Indicar empregado que fica ativo:      50 moedas
  Indicar empregador que publica vaga:   80 moedas
  Indicar empreendedor:                 150 moedas
  Primeira candidatura:                   5 moedas
  Diária concluída com avaliação:        10 moedas
  Avaliação 5 estrelas recebida:          5 moedas
  Avaliar o contratante após a diária:    3 moedas
  Acessar o app 7 dias seguidos:         15 moedas (streak)
  Completar curso gratuito:              30 moedas

EMPREGADOR:
  Cadastro com código de empreendedor:   50 moedas (bônus)
  Cadastro sem código:                   10 moedas
  Publicar primeira vaga:                15 moedas
  Contratar via plataforma (confirmar):  20 moedas
  Avaliar profissional:                   3 moedas
  Indicar outro empregador:              60 moedas
```

### 4.2 Tabela de uso de moedas — digital

```
EMPREGADO:
  Currículo no topo dos resultados · 7 dias:    100 moedas
  Badge "Verificado" · 30 dias:                  80 moedas
  Candidatura express (prioridade na fila):       30 moedas
  Acesso a curso premium (1 módulo):              60 moedas
  Boost de visibilidade · 24h (extra urgente):   50 moedas

EMPREGADOR:
  Vaga em destaque no grupo · 7 dias:            200 moedas
  Filtro avançado de candidatos · 30 dias:       150 moedas
  Desbloqueio de contato direto (1 candidato):   40 moedas
```

### 4.3 Tabela de uso de moedas — FÍSICO (oportunidades de parceiros)

```
EXPERIÊNCIAS (quantidade sempre limitada):
  Chop em bar parceiro:                  80 moedas
  Porção de batata frita:               100 moedas
  Hambúrguer artesanal:                 150 moedas
  Pizza individual:                     180 moedas
  Ingresso balada:                      250 moedas
  Corte de cabelo:                      200 moedas
  Combo lanche + refri:                 120 moedas
  Desconto 20% (qualquer produto):       60 moedas
  Brinde surpresa:                       50 moedas
  Consulta gratuita (serviço):          300 moedas

REGRA: cada oportunidade física tem quantidade máxima definida pelo parceiro.
Quando acabar, não aparece mais. Cria senso de urgência real.
```

### 4.4 Banco de dados — moedas

```sql
-- Saldo de moedas por usuário
user_coins (
  user_id     UUID PRIMARY KEY FK users.id,
  balance     INTEGER DEFAULT 0,
  total_earned INTEGER DEFAULT 0,  -- histórico total ganho
  updated_at  TIMESTAMP
)

-- Histórico de transações de moedas
coin_transactions (
  id          UUID PRIMARY KEY,
  user_id     UUID FK users.id,
  type        ENUM('earn','spend'),
  amount      INTEGER,
  reason      VARCHAR(60),  -- ex: 'indicacao_empregado', 'troca_chop_bar_x'
  ref_id      UUID,         -- id da entidade relacionada (vaga, oportunidade, etc)
  created_at  TIMESTAMP
)
```

### 4.5 Regras de integridade das moedas

```
- Moedas não têm valor monetário (evitar regulação de moeda virtual)
- Moedas não podem ser transferidas entre usuários
- Moedas não podem ser compradas com dinheiro real (inicialmente)
- Moedas não vencem (sem prazo de expiração)
- Moedas de bônus de cadastro são bloqueadas por 7 dias (evitar fraude)
- Se o usuário for banido, moedas são zeradas
- Saldo mínimo para qualquer troca: 0 (não negativo)
```

---

## 5. OPORTUNIDADES FÍSICAS

### 5.1 O que é uma oportunidade física

Uma empresa local cadastra um brinde ou experiência com **quantidade limitada**. Usuários com moedas suficientes podem resgatar. A empresa paga para abrir a oportunidade — esse é o produto que converte empresa local em anunciante.

### 5.2 Fluxo completo

```
1. Empresa decide oferecer 20 chops para o fim de semana
2. Acessa o app como contratante ou anunciante
3. Cria a oportunidade:
   - Nome: "1 Chop Long Neck Grátis"
   - Custo em moedas: 80
   - Quantidade: 20 unidades
   - Validade: até domingo 23h
   - Local: Bar do Zé, Rua X, nº Y
   - Foto do produto
4. Paga para abrir a oportunidade (isso é o produto vendido pelo empreendedor)
5. Oportunidade aparece na aba de moedas/oportunidades
6. Usuário resgata → recebe QR Code no app
7. Vai ao local → mostra o QR → estabelecimento lê e confirma
8. Quantidade disponível cai automaticamente
9. Quando zerar: "Esgotado" aparece (com contagem de quem chegou tarde — gera FOMO)
```

### 5.3 Por que a empresa paga para abrir uma oportunidade

```
Para a empresa:
  - Custo de aquisição de cliente: em vez de pagar R$50 em anúncio,
    paga R$30 para abrir a oportunidade de 20 chops
  - Traz usuário qualificado fisicamente para o estabelecimento
  - Usuário que vai buscar o chop geralmente consome mais
  - Gera avaliação e visibilidade gratuita no app
  - Converte em cliente recorrente

Para a plataforma:
  - Receita de abertura de oportunidade (R$19–R$99 dependendo do escopo)
  - Empreendedor vende e fica com 90%
  - Ciclo: empresa → oportunidade → visita → satisfação → anunciante recorrente
```

### 5.4 Tabela de preços para abrir uma oportunidade

```
Escopo do grupo (só usuários do empreendedor):   R$19–R$39
Escopo cidade:                                   R$49–R$99
Escopo estado:                                   R$149–R$299
Escopo Brasil:                                   R$499+

Quantidade de unidades:
  Até 10:      incluso no preço base
  11–50:       +R$9
  51–200:      +R$29
  200+:        negociar
```

### 5.5 Banco de dados — oportunidades físicas

```sql
physical_opportunities (
  id              UUID PRIMARY KEY,
  empresa_id      UUID FK users.id,
  empreendedor_id UUID FK users.id,  -- quem vendeu a oportunidade
  titulo          VARCHAR(80),
  descricao       TEXT,
  foto_url        TEXT,
  custo_moedas    INTEGER,
  quantidade_total INTEGER,
  quantidade_restante INTEGER,
  escopo          ENUM('grupo','cidade','estado','brasil'),
  cidade          VARCHAR(60),
  estado          VARCHAR(2),
  grupo_id        UUID,              -- se escopo = grupo
  local_nome      VARCHAR(100),
  local_endereco  TEXT,
  lat             DECIMAL,
  lng             DECIMAL,
  valida_ate      TIMESTAMP,
  ativa           BOOLEAN DEFAULT true,
  criado_em       TIMESTAMP
)

physical_redemptions (
  id              UUID PRIMARY KEY,
  oportunidade_id UUID FK physical_opportunities.id,
  user_id         UUID FK users.id,
  moedas_gastas   INTEGER,
  qrcode_token    VARCHAR(64) UNIQUE,  -- token do QR Code
  resgatado_em    TIMESTAMP,
  confirmado_em   TIMESTAMP,           -- quando empresa leu o QR
  confirmado_por  UUID,                -- user da empresa que confirmou
  status          ENUM('pendente','confirmado','expirado','cancelado')
)
```

### 5.6 Geração e leitura do QR Code

```javascript
// Geração (quando usuário resgata)
const token = crypto.randomUUID() + Date.now();
const qrData = {
  redemption_id: redemption.id,
  token: token,
  expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48h
};
// QR Code contém: diaria.cidade.com.br/qr/{token}

// Leitura (empresa abre câmera no app)
// Lê o QR → busca token no banco → confirma o resgate → baixa o estoque
// Atualização atômica para evitar double-spend:
UPDATE physical_redemptions
SET status = 'confirmado', confirmado_em = NOW()
WHERE qrcode_token = $1 AND status = 'pendente'
RETURNING *;
// Se não retornar nada: QR já foi usado ou expirado → mostrar erro
```

---

## 6. PRODUTOS VENDÁVEIS PELO EMPREENDEDOR

### 6.1 Catálogo completo de produtos

```
PRODUTOS DE VISIBILIDADE (recorrente):
  Destaque grupo — vaga no topo:        R$19/semana por vaga
  Destaque grupo — candidato no topo:   R$9/semana por candidato
  Banner no grupo:                      R$49/mês (máx 2 por grupo)
  Card oportunidade (digital):          R$79/mês

PRODUTOS DE EXPERIÊNCIA (pontual):
  Oportunidade física:                  R$19–R$99 (conforme escopo)
  Limite de slots por escopo definido

FILTRO AVANÇADO:
  Acesso filtro avançado · empregador:  R$29–R$79/mês
  Inclui: filtragem por nota mínima, distância, habilidades, histórico

CURSOS:
  Empreendedor vende curso da plataforma ao usuário
  Comissão: 70–90% para o empreendedor
  Plataforma retém: 10–30%

UPGRADES (empreendedor vende mas parte vai para plataforma):
  Upgrade destaque cidade:              R$49–R$199/mês
  Upgrade destaque estado:              R$149–R$499/mês
  Parcela do empreendedor: 20–30% sobre o valor total
```

### 6.2 Filtro avançado de candidatos — o que inclui

```
FILTRO BÁSICO (gratuito para todos):
  - Categoria / habilidade
  - Cidade / distância básica
  - Disponibilidade (manhã/tarde/noite)
  - Presencial ou remoto

FILTRO AVANÇADO (pago ou moedas):
  - Nota mínima de avaliação (ex: apenas candidatos com 4.5+)
  - Distância exata em km
  - Número mínimo de diárias concluídas
  - Habilidades secundárias (múltiplas)
  - Disponibilidade por dia específico da semana
  - Filtro por faixa de valor aceito
  - Último acesso ao app (ex: ativo nos últimos 7 dias)
  - Tem transporte próprio: sim/não
  - Já trabalhou com o empregador antes: sim/não
  - Candidatos fixados no topo (destaque de grupo/cidade)
```

---

## 7. CURSOS E CERTIFICAÇÕES

### 7.1 Estrutura de cursos

```
CURSOS GRATUITOS (acesso padrão ou via moedas):
  - Conteúdo da escola do fundador
  - Acesso via: cadastro com código (bônus) ou 60 moedas
  - Exemplos:
    · Diarista Profissional — 4 módulos
    · Garçom de Eventos — 5 módulos
    · Cuidador de Idosos Básico — 3 módulos
    · Atendente de Telemarketing — 4 módulos
    · Auxiliar Administrativo — 3 módulos

CURSOS PREMIUM (pagos — vendidos pelo empreendedor):
  - Preço: R$47–R$197 por curso
  - Empreendedor vende com seu código e fica com 70–90%
  - Plataforma retém 10–30%
  - Exemplos:
    · Garçom Avançado — Eventos Corporativos
    · Diarista Premium — Casas de Alto Padrão
    · Cuidador Especializado — Alzheimer e Parkinson
    · Gestão de Equipe para Pequenos Negócios

CERTIFICAÇÃO COM BADGE:
  - Após concluir curso (gratuito ou pago), usuário pode emitir certificado
  - Certificado: R$19–R$29 (ou 200 moedas)
  - Badge aparece no perfil publicamente
  - Empregador vê o badge na lista de candidatos
  - Badge aumenta o ranking orgânico do candidato
```

### 7.2 Banco de dados — cursos

```sql
courses (
  id              UUID PRIMARY KEY,
  titulo          VARCHAR(120),
  descricao       TEXT,
  nivel           ENUM('gratuito','premium'),
  preco           DECIMAL(10,2),  -- 0 se gratuito
  preco_moedas    INTEGER,        -- custo em moedas se gratuito
  modulos         INTEGER,
  categoria       VARCHAR(60),
  carga_horaria   INTEGER,        -- em minutos
  ativo           BOOLEAN DEFAULT true,
  criado_em       TIMESTAMP
)

course_enrollments (
  id          UUID PRIMARY KEY,
  user_id     UUID FK users.id,
  course_id   UUID FK courses.id,
  origem      ENUM('bonus_codigo','moedas','pago','gratuito'),
  pago_por    DECIMAL,
  empreendedor_id UUID,  -- quem vendeu (se origem = pago)
  progresso   INTEGER DEFAULT 0,  -- 0-100%
  concluido   BOOLEAN DEFAULT false,
  concluido_em TIMESTAMP,
  inscrito_em TIMESTAMP
)

course_certificates (
  id              UUID PRIMARY KEY,
  user_id         UUID FK users.id,
  course_id       UUID FK courses.id,
  enrollment_id   UUID FK course_enrollments.id,
  codigo_cert     VARCHAR(20) UNIQUE,  -- ex: CERT-2025-00142
  emitido_em      TIMESTAMP,
  pago            BOOLEAN,
  valor_pago      DECIMAL
)
```

---

## 8. BANCO DE DADOS — ESTRUTURA PRINCIPAL

### 8.1 Tabela de usuários

```sql
users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            VARCHAR(120) NOT NULL,
  celular         VARCHAR(20) UNIQUE NOT NULL,
  email           VARCHAR(120) UNIQUE,
  cep             VARCHAR(9),
  cidade          VARCHAR(80),
  estado          VARCHAR(2),
  lat             DECIMAL,
  lng             DECIMAL,
  tipo            ENUM('empregado','empregador','empreendedor','admin_regional','admin_master'),
  codigo_proprio  VARCHAR(10) UNIQUE,  -- só para empreendedor
  foto_url        TEXT,
  celular_visivel BOOLEAN DEFAULT false,
  trabalha_presencial BOOLEAN DEFAULT true,
  trabalha_remoto     BOOLEAN DEFAULT false,
  ativo           BOOLEAN DEFAULT true,
  termo_aceito_em TIMESTAMP,
  criado_em       TIMESTAMP DEFAULT NOW(),
  ultimo_acesso   TIMESTAMP
)
```

### 8.2 Tabela de vagas

```sql
jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empregador_id   UUID FK users.id,
  titulo          VARCHAR(120) NOT NULL,
  descricao       TEXT,
  categoria       VARCHAR(60),
  tipo            ENUM('diaria','emprego_fixo','remoto'),
  formato         ENUM('presencial','remoto','hibrido'),
  data_inicio     DATE,
  horario_inicio  TIME,
  horario_fim     TIME,
  recorrente      BOOLEAN DEFAULT false,
  dias_recorrencia INTEGER[],  -- 0=dom,1=seg,...,6=sab
  valor           DECIMAL(10,2),
  vagas_total     INTEGER DEFAULT 1,
  vagas_restantes INTEGER DEFAULT 1,
  cidade          VARCHAR(80),
  estado          VARCHAR(2),
  lat             DECIMAL,
  lng             DECIMAL,
  urgente         BOOLEAN DEFAULT false,
  
  -- visibilidade / destaque
  destaque_nivel  ENUM('organico','grupo','cidade','estado','brasil') DEFAULT 'organico',
  destaque_grupo_id UUID,        -- id do empreendedor cujo grupo vê no topo
  destaque_ate    TIMESTAMP,     -- quando o destaque expira
  
  ativa           BOOLEAN DEFAULT true,
  criado_em       TIMESTAMP DEFAULT NOW()
)
```

### 8.3 Tabela de destaques (compras)

```sql
highlights (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_entidade   ENUM('vaga','candidato','banner','oportunidade'),
  entidade_id     UUID,          -- id da vaga, perfil ou oportunidade
  nivel           ENUM('grupo','cidade','estado','brasil'),
  grupo_id        UUID,          -- empreendedor responsável pelo grupo
  empreendedor_id UUID FK users.id,  -- quem vendeu
  valor_cobrado   DECIMAL(10,2),
  valor_plataforma DECIMAL(10,2),
  valor_empreendedor DECIMAL(10,2),
  pago_via        ENUM('pix','moedas','gratuito_bonus'),
  pix_chave       VARCHAR(120),  -- chave Pix do empreendedor
  status_pagamento ENUM('pendente','confirmado','expirado') DEFAULT 'pendente',
  ativo_de        TIMESTAMP,
  ativo_ate       TIMESTAMP,
  criado_em       TIMESTAMP DEFAULT NOW()
)
```

### 8.4 Tabela de empreendedores

```sql
entrepreneurs (
  user_id         UUID PRIMARY KEY FK users.id,
  codigo          VARCHAR(10) UNIQUE NOT NULL,
  nome_instancia  VARCHAR(80),    -- ex: "Diária Sinop"
  cor_principal   VARCHAR(7),     -- hex
  logo_url        TEXT,
  pix_chave       VARCHAR(120),
  pix_tipo        ENUM('cpf','cnpj','celular','email','aleatoria'),
  pix_banco       VARCHAR(60),
  tipo_pessoa     ENUM('pf','mei','cnpj'),
  documento       VARCHAR(20),    -- CPF ou CNPJ
  
  -- metas gratuitas
  periodo_gratis_inicio TIMESTAMP,
  periodo_gratis_fim    TIMESTAMP,
  meta_usuarios_ativos  INTEGER DEFAULT 5,
  meta_vendas_mes       INTEGER DEFAULT 1,
  
  -- status
  status          ENUM('ativo','em_risco','suspenso','encerrado') DEFAULT 'ativo',
  plano           ENUM('gratuito','pago') DEFAULT 'gratuito',
  plano_valor     DECIMAL DEFAULT 0,
  
  criado_em       TIMESTAMP DEFAULT NOW()
)
```

### 8.5 Tabela de comissões

```sql
commissions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empreendedor_id   UUID FK users.id,
  tipo              VARCHAR(60),   -- 'destaque_grupo', 'upgrade_cidade', 'curso', 'oportunidade_fisica'
  origem_id         UUID,          -- id da compra/highlight
  valor_bruto       DECIMAL(10,2),
  percentual        DECIMAL(5,2),  -- ex: 90.00
  valor_empreendedor DECIMAL(10,2),
  valor_plataforma  DECIMAL(10,2),
  status            ENUM('pendente','pago') DEFAULT 'pendente',
  pago_em           TIMESTAMP,
  acumulado_taxa    DECIMAL(10,2), -- taxa acumulada para cobrança da plataforma
  criado_em         TIMESTAMP DEFAULT NOW()
)
```

---

## 9. REGRAS DE NEGÓCIO CRÍTICAS

### 9.1 Visibilidade — regras invioláveis

```
REGRA 1: Todo usuário SEMPRE vê todo o conteúdo
  → Nenhuma vaga ou candidato é ocultado por falta de pagamento
  → Apenas a POSIÇÃO no feed muda

REGRA 2: Destaque de grupo só sobe para usuários do mesmo grupo
  → Um destaque pago pelo código JOAO2025 não aparece no topo
    para usuários que se cadastraram com MARIA01
  → Ambos veem a vaga, mas em posições diferentes

REGRA 3: Destaque de cidade sobe para todos da cidade
  → Independente do grupo
  → Usuários sem grupo também veem

REGRA 4: Máximo 3 vagas patrocinadas consecutivas no topo
  → Depois das 3, alterna com 1 orgânica
  → Evita sensação de feed pago demais

REGRA 5: Badge "Patrocinado" obrigatório mas discreto
  → Texto pequeno, cor neutra
  → Não pode ser removido
```

### 9.2 Moedas — regras de integridade

```
REGRA 1: Moeda de indicação só credita quando o indicado for ATIVO
  → Ativo = completou o perfil E (fez 1 candidatura OU publicou 1 vaga)
  → Não credita por cadastro simples (evitar fraude)

REGRA 2: Moedas de bônus de cadastro (código) ficam bloqueadas 7 dias
  → Usuário não pode gastar imediatamente (evitar cadastro fake)
  → Após 7 dias: liberadas automaticamente

REGRA 3: Oportunidade física — resgate é atômico
  → O estoque é decrementado e o resgate é criado em 1 transação
  → Usar SELECT FOR UPDATE para evitar double-spend

REGRA 4: QR Code de oportunidade expira em 48h
  → Após esse prazo: status = 'expirado', moedas são devolvidas
  → Empresa pode configurar expiração menor (ex: válido só no dia)

REGRA 5: Empreendedor não pode dar moedas manualmente
  → Todas as moedas são geradas por ações verificadas no sistema
```

### 9.3 Empreendedor — regras de comissão

```
REGRA 1: Pagamento direto ao Pix do empreendedor
  → O app exibe a chave Pix do empreendedor na tela de pagamento
  → Cliente faz Pix diretamente — o dinheiro vai para o empreendedor
  → O app registra a compra mas NÃO intermedia o pagamento

REGRA 2: Taxa da plataforma (10%) é cobrada acumulada
  → Quando o acumulado de taxa superar R$150
  → A plataforma envia Pix de cobrança ao empreendedor
  → Empreendedor tem 7 dias para pagar
  → Após 7 dias sem pagamento: destaques pausados (não usuários)

REGRA 3: Repasse de upgrade (cidade/estado/brasil)
  → Quando a plataforma vende um upgrade nacional
  → Identifica qual empreendedor originou o cliente (pelo grupo)
  → Envia repasse automático via Pix (20–30% do valor)
  → Se o cliente não veio de nenhum grupo: sem repasse

REGRA 4: Empreendedor só vende produtos dentro do seu escopo
  → Pode vender: grupo e cidade
  → Não pode vender: estado e brasil (só plataforma master vende)
  → Mas recebe repasse quando cliente compra estado/brasil
```

---

## 10. MVP — ORDEM DE DESENVOLVIMENTO

### 10.1 Sprint 1 — Semanas 1–2: Fundação
```
□ Banco de dados: users, jobs, applications
□ Autenticação: cadastro + login + recuperação de senha
□ Cadastro com campo de código de empreendedor
□ Aceite de termos com timestamp
□ Perfil básico (empregado e empregador)
```

### 10.2 Sprint 2 — Semanas 3–4: Core do produto
```
□ Feed de vagas com filtros básicos
□ Publicação de vaga (empregador)
□ Candidatura com 1 toque (empregado)
□ Chat básico (Supabase Realtime ou similar)
□ Toggle celular visível no chat
□ Notificações push (candidatura recebida, mensagem nova)
```

### 10.3 Sprint 3 — Semanas 5–6: Código e empreendedor
```
□ Tabela entrepreneurs e user_group
□ Cadastro de empreendedor com geração de código único
□ Link de indicação: /ref/CODIGO
□ Bônus de boas-vindas ao usar código (moedas iniciais)
□ Painel básico do empreendedor (usuários no grupo, contador)
□ QR Code do link de indicação gerado no painel
```

### 10.4 Sprint 4 — Semanas 7–8: Visibilidade e destaques
```
□ Lógica de prioridade de feed (4 camadas)
□ Tabela highlights
□ Destaque de grupo (vaga e candidato)
□ Tela de compra de destaque (exibe Pix do empreendedor)
□ Confirmação manual de pagamento (webhook ou toggle)
□ Badge "Patrocinado" nos itens em destaque
□ Limite de slots anti-poluição (máx 3 seguidos)
```

### 10.5 Sprint 5 — Semanas 9–10: Moedas
```
□ Tabelas user_coins e coin_transactions
□ Crédito automático de moedas por ação
□ Tela de saldo de moedas no perfil
□ Extrato de moedas (histórico)
□ Bloqueio de 7 dias para moedas de cadastro
□ Troca de moedas por destaque digital
□ Verificação de atividade antes de creditar indicação
```

### 10.6 Sprint 6 — Semanas 11–12: Oportunidades físicas
```
□ Tabelas physical_opportunities e physical_redemptions
□ Tela de criação de oportunidade (empresa)
□ Feed de oportunidades (aba separada ou seção no app)
□ Resgate de oportunidade (débito atômico de moedas)
□ Geração de QR Code de resgate
□ Leitura de QR Code pelo estabelecimento
□ Confirmação e baixa de estoque
□ Expiração automática de QR Code após 48h
```

### 10.7 Sprint 7 — Semanas 13–14: Avaliações e cursos
```
□ Sistema de avaliações (estrelas + tópicos)
□ Histórico de avaliações no perfil
□ Distribuição de estrelas (gráfico de barras)
□ Integração básica de cursos (iframe ou deep link)
□ Tabela course_enrollments
□ Badge de certificação no perfil
□ Crédito de moedas ao concluir curso
```

### 10.8 Sprint 8 — Semanas 15–16: Financeiro e admin
```
□ Tabela commissions e acumulação de taxa
□ Painel financeiro do empreendedor (transações, taxa acumulada)
□ Painel admin master (métricas globais)
□ Aprovação de empreendedores
□ Termômetro de crescimento
□ Relatórios básicos (usuários por cidade, vagas, moedas em circulação)
```

### 10.9 Pós-MVP: Escala
```
□ Filtro avançado de candidatos (busca paga)
□ Upgrade destaque cidade (compra no app)
□ Upgrade estado e brasil (via admin master)
□ Repasse automático via Pix API
□ Marketplace de cursos completo
□ Consórcios e seguros integrados
□ Dashboard de impacto para empresas (quantas visitas gerou)
```

---

## RESUMO EXECUTIVO PARA O DESENVOLVEDOR

### O que torna este sistema único tecnicamente

**1. Feed com 4 camadas de prioridade**
Não é um feed simples — é uma query com 4 níveis de prioridade que muda conforme o grupo do usuário. A implementação precisa ser eficiente (índices corretos nas colunas de destaque).

**2. Moedas como produto real**
Não é só gamificação — moedas têm valor real (podem ser trocadas por experiências físicas com QR Code). Exige integridade transacional e proteção contra fraude.

**3. QR Code atômico**
O resgate de oportunidade física precisa ser atômico no banco (SELECT FOR UPDATE) para evitar que o mesmo QR seja usado duas vezes em paralelo.

**4. Código de empreendedor como eixo central**
Tudo se conecta ao código: o feed do usuário, as comissões do empreendedor, os bônus de cadastro, a atribuição de destaque. O campo `grupo_id` em vagas e highlights precisa ser performático.

**5. Zero intermediação de pagamento no MVP**
O app não processa dinheiro — apenas registra. O Pix vai direto ao empreendedor. A plataforma cobra a taxa acumulada depois. Isso simplifica enormemente o MVP e elimina a necessidade de licença de intermediador financeiro.

---

*Especificação técnica — Diária da Cidade v3.0*  
*Para desenvolvimento MVP: priorizar Sprints 1–5*  
*Sprints 6–8 podem ser paralelos após validação do core*
