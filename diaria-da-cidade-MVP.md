# Diária da Cidade — Documento de MVP
## "Trabalhe hoje. Contrate hoje. Perto de você."

**Versão:** 1.0 — Mínimo Viável  
**Objetivo:** Lançar, validar e crescer com o menor custo e tempo possíveis  
**Público do lançamento:** 1 cidade-piloto, 3 perfis ativos (Empregado, Empregador, Empreendedor)

---

## O que é um MVP nesse contexto

MVP não significa app incompleto. Significa app que faz **uma coisa muito bem**: conectar quem precisa trabalhar hoje com quem precisa contratar hoje, perto de onde os dois estão.

Tudo o que não serve diretamente essa função pode esperar.

---

## Os 5 perfis — o que entra no MVP e o que fica para depois

| Perfil | Status no MVP | Justificativa |
|---|---|---|
| 👷 Empregado | ✅ Entra completo | É o produto. Sem ele não há nada. |
| 🏢 Empregador | ✅ Entra completo | É quem gera as vagas. Sem ele o empregado não tem o que ver. |
| 💡 Empreendedor | ✅ Entra — versão simplificada | Necessário para o modelo de crescimento funcionar desde o início. |
| 🗺️ Admin Regional | ⏳ Fase 2 | No lançamento você faz esse papel manualmente. |
| 👑 Admin Master | ⏳ Fase 2 | Você gerencia tudo por planilha e WhatsApp inicialmente. |

---

## Telas que ENTRAM no MVP — por perfil

### 👷 Empregado (6 telas)

| # | Tela | Por que entra |
|---|---|---|
| 1 | Splash / Apresentação | Primeira impressão. Precisa comunicar o valor em 3 segundos. |
| 2 | Escolha de perfil | Define o tipo de experiência. Simples e obrigatório. |
| 3 | Cadastro + Termos | Dados mínimos + aceite legal. Sem isso não há conta. |
| 4 | Feed de vagas | O coração do produto. Filtros básicos: urgente, presencial/remoto. |
| 5 | Detalhe da vaga | Todas as infos para decidir. Inclui estrelas do contratante. |
| 6 | Candidatura + Chat | Confirma a candidatura e abre o chat com o contratante. |

**Fora do MVP por ora:** calendário de disponibilidade detalhado, teste de perfil quiz, experiências profissionais, avaliações recebidas. Esses enriquecem o perfil mas não impedem o uso inicial.

---

### 🏢 Empregador (5 telas)

| # | Tela | Por que entra |
|---|---|---|
| 1 | Cadastro + Termos | Mesmo fluxo do empregado, adaptado para contratante. |
| 2 | Publicar vaga | Formulário simples. Tipo, cargo, data, valor, local ou remoto. |
| 3 | Minhas vagas ativas | Lista das vagas publicadas com status básico. |
| 4 | Ver candidatos com ⭐ | Lista com estrelas, tópicos e botão de contato. |
| 5 | Chat com candidato | Comunicação direta. Combinam pagamento aqui. |

**Fora do MVP por ora:** calendário de demanda recorrente, avaliação pós-diária, histórico completo. Avaliações entram na Fase 2 porque precisam de diárias concluídas para existirem.

---

### 💡 Empreendedor (3 telas — versão simplificada)

| # | Tela | Por que entra |
|---|---|---|
| 1 | Cadastro de parceiro + Termos | Nome da instância, Pix, tipo de pessoa (MEI/CNPJ/PF). |
| 2 | Painel básico | Usuários na instância, meta gratuita, botão de vender. |
| 3 | Vender destaque (fluxo simples) | Seleciona produto, informa cliente, gera cobrança via Pix. |

**Fora do MVP por ora:** config visual completa, planos premium regionais/nacionais, repasse automático. No início o repasse é manual via Pix até a automação ser implementada.

---

## Telas que FICAM DE FORA do MVP e por quê

| Tela / Funcionalidade | Fase | Motivo |
|---|---|---|
| Teste de perfil (quiz 3 perguntas) | 2 | Melhora o feed, mas feed funciona sem ele |
| Histórico de experiências | 2 | Enriquece o perfil mas não é bloqueante |
| Calendário de disponibilidade | 2 | Filtro básico já resolve no início |
| Avaliações e estrelas (dar e receber) | 2 | Precisam de histórico de diárias concluídas |
| Calendário recorrente do empregador | 2 | Agendamento manual resolve por ora |
| Admin Regional (painel) | 2 | Você faz isso por WhatsApp no início |
| Admin Master (painel) | 2 | Planilha + acesso direto ao banco de dados |
| Planos premium cidade/regional/nacional | 3 | Só faz sentido quando houver volume |
| Repasse automático via Pix | 3 | Repasse manual até atingir escala |
| Termômetro de fases (controle master) | 3 | Tudo grátis no lançamento, não precisa do controle ainda |
| Home Office como categoria separada | 1.5 | Entra logo após validação inicial |
| Aba Oportunidades | 3 | Monetização avançada, não é core do MVP |

---

## Funcionalidades técnicas do MVP — o que precisa existir por baixo

### Autenticação
- Cadastro com e-mail + senha
- Login simples
- Recuperação de senha por e-mail
- Sem login social por ora (Google/Facebook ficam para depois)

### Banco de dados (estrutura mínima)
- **Usuários:** nome, tipo (empregado/empregador/parceiro), cidade, CEP, celular, e-mail, habilidades, aceite de termos com timestamp
- **Vagas:** título, categoria, tipo (presencial/remoto), data, valor, escopo (local/cidade/estado), status (ativa/pausada/encerrada), id do criador
- **Candidaturas:** id da vaga, id do candidato, status (pendente/aceita/recusada), timestamp
- **Conversas:** id dos participantes, mensagens com timestamp
- **Parceiros:** nome da instância, link, CEP da região, chave Pix, tipo de pessoa, meta de usuários, meta de vendas

### Notificações (mínimas)
- Push quando candidatura é aceita
- Push quando recebe mensagem nova
- E-mail de confirmação de cadastro
- Sem notificações elaboradas por ora

### Filtros do feed (mínimos)
- Por categoria (limpeza, gastronomia, construção, etc.)
- Por urgência (hoje / esta semana / próximas)
- Por tipo (presencial / remoto)
- Por localização (raio em km a partir do CEP cadastrado)
- Sem IA ou recomendação personalizada por ora

### Instância do parceiro (MVP)
- Subdomínio simples: nomecidade.diaria.cidade.com.br
- Filtro geográfico automático por CEP
- Logo e nome personalizados
- Cor principal personalizável (uma cor só)
- Chave Pix cadastrada e exibida na tela de pagamento

### Pagamento (MVP)
- **Nenhum gateway de pagamento.** Tudo é Pix manual entre as partes.
- O app exibe a chave Pix do parceiro na tela de cobrança.
- O parceiro confirma manualmente quando receber.
- O app registra a venda para controle da taxa de 10%.
- A cobrança da taxa também é manual via Pix no início.

### Moderação (MVP)
- Botão de denúncia em toda vaga e perfil.
- Denúncias chegam por e-mail para você (admin master) revisar manualmente.
- Sem painel de moderação ainda.

---

## Fluxo principal em 7 passos — o que precisa funcionar no dia 1

```
1. Usuário baixa o app / abre o link da instância regional
2. Vê o splash com o nome e logo do parceiro local
3. Escolhe o perfil (empregado ou empregador)
4. Faz o cadastro simples + aceita os termos
5. [Empregado] Vê o feed de vagas filtradas pela sua cidade
6. [Empregado] Abre uma vaga, vê os detalhes e se candidata
7. Chat abre automaticamente — combinam tudo por mensagem
```

Esse ciclo completo precisa funcionar sem erro, sem lentidão e sem confusão. Tudo o mais é secundário.

---

## Critérios de sucesso do MVP — como saber se funcionou

Não defina sucesso por número de downloads. Defina por comportamento real:

| Métrica | Meta mínima (30 dias) | Meta boa (30 dias) |
|---|---|---|
| Usuários cadastrados | 50 | 200 |
| Vagas publicadas | 10 | 40 |
| Candidaturas enviadas | 20 | 100 |
| Conversas iniciadas | 15 | 80 |
| Diárias confirmadas (pelo chat) | 5 | 30 |
| Parceiros ativos | 1 | 3 |
| Taxa de retorno (voltou em 7 dias) | 30% | 50% |

Se em 30 dias você tiver 5 diárias confirmadas e os dois lados voltaram a usar o app, o modelo está validado.

---

## Riscos do MVP e como mitigar

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Poucos empregadores no início | Alta | Parceiro recruta ativamente 10 empresas antes do lançamento |
| Empregados se cadastram mas não encontram vagas | Alta | Garantir ao menos 5 vagas ativas antes de divulgar para empregados |
| Pagamentos não acontecem (calote) | Média | Sistema de avaliação pós-diária cria pressão social |
| Parceiro não consegue atingir a meta | Média | Parceiro piloto escolhido a dedo, com rede de contatos local forte |
| App instável no lançamento | Baixa (se bem testado) | Teste com 10 usuários reais antes do lançamento público |

---

## Ordem de desenvolvimento sugerida

Se você contratar um desenvolvedor ou usar no-code, essa é a ordem lógica:

**Semana 1–2:** Banco de dados + autenticação + cadastro com termos  
**Semana 3–4:** Feed de vagas + filtros básicos + publicar vaga  
**Semana 5:** Detalhe da vaga + candidatura + chat  
**Semana 6:** Painel do parceiro + Pix na tela de cobrança + instância regional  
**Semana 7:** Testes com usuários reais + ajustes  
**Semana 8:** Lançamento da cidade-piloto  

**Total estimado:** 8 semanas com um dev experiente em React Native + Supabase, ou 10–12 semanas em no-code com FlutterFlow.

---

## Custo estimado do MVP

| Item | No-code (FlutterFlow) | Dev contratado |
|---|---|---|
| Desenvolvimento | R$0–R$500/mês (plataforma) | R$8k–R$20k (projeto fechado) |
| Banco de dados (Supabase) | R$0 até 50k linhas | R$0 até 50k linhas |
| Hospedagem | R$0–R$50/mês | R$0–R$50/mês |
| Domínio | R$50/ano | R$50/ano |
| INPI (registro de marca) | R$355–R$842 | R$355–R$842 |
| **Total 1º ano** | **~R$1k–R$3k** | **~R$9k–R$22k** |

No-code é suficiente para validar. Só migre para código nativo quando o modelo estiver provado.

---

## Próximo passo imediato após este documento

Escolha **uma cidade** para ser o piloto. Critérios ideais:
- Você conhece pessoas lá (rede de contatos para recrutar usuários)
- Cidade de 20k a 200k habitantes (pequena o suficiente para dominar, grande o suficiente para ter demanda)
- Tem comércio local ativo: eventos, restaurantes, construção, serviços domésticos

Com a cidade escolhida, o próximo passo é o item 3 do roteiro: escolher a stack e contratar ou desenvolver.

---

*Documento preparado como base para o desenvolvimento do MVP do Diária da Cidade*  
*Versão 1.0 — pronto para apresentar a desenvolvedor ou equipe técnica*
