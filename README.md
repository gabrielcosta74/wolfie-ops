# Wolfie Ops

Painel interno em Next.js para operar os workflows agentic do Wolfie.

## Objetivo desta v1

- observar workflows, runs e findings;
- disparar manualmente o `official-monitor`;
- disparar manualmente o `curriculum-diff`;
- disparar manualmente o `proposal-engine`;
- rever proposals e registar decisões humanas.

## Setup

1. Criar `wolfie-ops/.env.local` a partir de `.env.example`.
2. Instalar dependências em `wolfie-ops`.
3. Correr `npm run dev`.

## Variáveis

- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto Supabase do Wolfie.
- `SUPABASE_SERVICE_ROLE_KEY`: usada apenas server-side para ler as tabelas agentic.
- `AGENT_OPS_SHARED_SECRET`: segredo partilhado entre o painel e a Edge Function `official-monitor`.
- `OPS_BASIC_AUTH_USER` e `OPS_BASIC_AUTH_PASSWORD`: protegem o painel com basic auth simples nesta fase.

## Segurança da v1

Esta primeira versão usa:

- basic auth no painel;
- service role apenas no servidor Next.js;
- segredo partilhado para disparar o workflow interno.

Para uma fase posterior, a recomendação é migrar para Supabase Auth com RBAC de admins.

## Fluxo desta fase

1. `official-monitor` gera findings.
2. `curriculum-diff` deriva impactos curriculares e gaps de conteúdo ligados à taxonomia oficial.
3. `proposal-engine` converte findings pendentes em `agent_proposals`.
4. O operador valida no painel com `approve`, `reject` ou `needs_revision`.
5. As decisões ficam registadas em `agent_reviews`.
6. `controlled-executor` só executa proposals aprovadas e compatíveis com a política atual.

## Política de execução atual

O executor desta fase é conservador.

Executa automaticamente:

- `report` de risco `low`;
- `execution_plan` de risco `low`;
- propostas editoriais de risco `low` sem `sql_draft`, convertidas em pacote de staging.

Bloqueia e deixa em `approved`:

- qualquer proposal com `sql_draft`;
- qualquer proposal com risco `medium`, `high` ou `critical`;
- `taxonomy_adjustment`;
- qualquer tipo ainda não suportado pela política.

## Política de quality scoring atual

O `exercise-auditor` trabalha por lotes pequenos e combina:

- heurísticas determinísticas;
- OpenAI para revisão qualitativa quando `OPENAI_API_KEY` existe;
- fallback heurístico quando não existe.

Os sinais principais desta fase são:

- `clarity_score`
- `alignment_score`
- `distractor_score`
- `telemetry_score`
- `redundancy_score`
- `difficulty_fit_score`

O auditor grava `exercise_quality_reviews` e só abre `agent_findings` quando:

- o `final_score` fica abaixo de `0.72`; ou
- a `recommendation` não é `keep`.

## Política de curriculum diff atual

O `curriculum-diff` lê findings de origem do tipo `official_change` e `exercise_issue` e tenta
ligá-los à taxonomia em `edu_temas_exame` e `edu_subtemas_exame`.

Regras desta fase:

- cria apenas findings derivados do tipo `curriculum_gap` ou `content_gap`;
- evita duplicados se já existir impacto ativo para o mesmo finding de origem;
- usa matching híbrido: scoring determinístico por keywords/códigos + OpenAI para escolher o
  melhor subtema quando há shortlist;
- quando a confiança é suficiente, envia o impacto para `pending_proposal`; se não for, deixa em
  `triaged` para revisão manual.
