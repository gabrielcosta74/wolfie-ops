import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { groupReviewItemsIntoBatches } from "@/lib/review-batches";

type WorkflowRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  schedule_kind: string | null;
  schedule_cron: string | null;
  risk_level: "low" | "medium" | "high" | "critical";
  is_active: boolean;
};

type RunRow = {
  id: string;
  workflow_id: string;
  trigger_type: string;
  status: "queued" | "running" | "succeeded" | "failed" | "canceled" | "needs_review";
  summary: string | null;
  input_payload: Record<string, unknown>;
  output_payload: Record<string, unknown>;
  error_log: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
};

type StepRow = {
  id: string;
  run_id: string;
  step_key: string;
  step_order: number;
  status: "pending" | "running" | "succeeded" | "failed" | "skipped";
  output_payload: Record<string, unknown>;
  error_log: string | null;
  started_at: string | null;
};

type SnapshotRow = {
  id: string;
  run_id: string;
  source_name: string;
  source_type: string;
  url: string;
  title: string | null;
  fetched_at: string;
};

type FindingRow = {
  id: string;
  run_id: string;
  finding_type: string;
  severity: "low" | "medium" | "high" | "critical";
  status:
    | "new"
    | "triaged"
    | "pending_proposal"
    | "pending_review"
    | "approved"
    | "rejected"
    | "archived";
  title: string;
  description: string;
  confidence: number;
  affected_theme: string | null;
  affected_subtopic: string | null;
  source_snapshot_ids: string[];
  metadata: Record<string, unknown>;
  created_at: string;
};

type ProposalRow = {
  id: string;
  run_id?: string;
  finding_id?: string | null;
  title: string;
  proposal_type: string;
  risk_level: "low" | "medium" | "high" | "critical";
  status:
    | "draft"
    | "pending_review"
    | "approved"
    | "rejected"
    | "needs_revision"
    | "executed"
    | "failed"
    | "superseded";
  rationale?: string | null;
  markdown_draft?: string | null;
  sql_draft?: string | null;
  structured_payload?: Record<string, unknown>;
  source_snapshot_ids?: string[];
  metadata?: Record<string, unknown>;
  reviewed_at?: string | null;
  executed_at?: string | null;
  created_at: string;
};

type ReviewRow = {
  id: string;
  proposal_id: string;
  reviewer_user_id: string | null;
  reviewer_type: "human" | "agent" | "system";
  decision: "approved" | "rejected" | "needs_revision" | "commented";
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

type QualityReviewRow = {
  id: string;
  run_id: string;
  exercise_source: "quiz_perguntas" | "exercicios_oficiais" | "exame_nacional_questions";
  exercise_id: string;
  final_score: number | null;
  recommendation: "keep" | "reclassify" | "rewrite" | "replace" | "generate_variants" | "review_manually";
  strengths: string[];
  issues: string[];
  metadata: Record<string, unknown>;
  created_at: string;
};

type ExerciseContext = {
  exerciseSource: string | null;
  sourceLabel: string;
  exerciseId: string | null;
  exerciseTitle: string | null;
  finalScore: number | null;
  recommendation: string | null;
  issues: string[];
  strengths: string[];
  statementPreview: string | null;
  difficulty: string | null;
  tags: string[];
  telemetryScore: number | null;
};

type ProposalDecisionModel = {
  problem: string;
  impact: string;
  priority: "low" | "medium" | "high";
  systemRecommendation: string;
  approveOutcome: string;
  rejectOutcome: string;
};

type ProposalListOptions = {
  statuses?: ProposalRow["status"][];
};

function indexById<T extends { id: string }>(rows: T[]) {
  return new Map(rows.map((row) => [row.id, row]));
}

function formatExerciseSourceLabel(source: string | null) {
  if (source === "quiz_perguntas") return "Pergunta do banco";
  if (source === "exercicios_oficiais") return "Exercício oficial";
  if (source === "exame_nacional_questions") return "Questão de exame";
  return "Exercício";
}

function numberOrNull(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function buildExerciseContext(
  metadata?: Record<string, unknown>,
  qualityReview?: QualityReviewRow | null,
): ExerciseContext | null {
  const qualityReviewMetadata = (qualityReview?.metadata ?? {}) as Record<string, unknown>;
  const qualityReviewHeuristics = ((qualityReviewMetadata.heuristics ?? {}) as Record<string, unknown>);
  const exerciseSource =
    typeof metadata?.exercise_source === "string" ? metadata.exercise_source : qualityReview?.exercise_source ?? null;
  const exerciseId =
    typeof metadata?.exercise_id === "string" ? metadata.exercise_id : qualityReview?.exercise_id ?? null;
  const exerciseTitle =
    typeof metadata?.title === "string"
      ? metadata.title
      : typeof qualityReview?.metadata?.title === "string"
        ? qualityReview.metadata.title
        : null;

  if (!exerciseSource && !exerciseId && !exerciseTitle) {
    return null;
  }

  return {
    exerciseSource,
    sourceLabel: formatExerciseSourceLabel(exerciseSource),
    exerciseId,
    exerciseTitle,
    finalScore: numberOrNull(metadata?.final_score) ?? qualityReview?.final_score ?? null,
    recommendation:
      typeof metadata?.recommendation === "string"
        ? metadata.recommendation
        : qualityReview?.recommendation ?? null,
    issues: Array.isArray(metadata?.issues)
      ? metadata.issues.filter((item): item is string => typeof item === "string")
      : qualityReview?.issues ?? [],
    strengths: Array.isArray(metadata?.strengths)
      ? metadata.strengths.filter((item): item is string => typeof item === "string")
      : qualityReview?.strengths ?? [],
    statementPreview:
      typeof metadata?.statement_preview === "string"
        ? metadata.statement_preview
        : typeof qualityReview?.metadata?.statement_preview === "string"
          ? qualityReview.metadata.statement_preview
          : null,
    difficulty:
      typeof metadata?.difficulty === "string"
        ? metadata.difficulty
        : typeof qualityReview?.metadata?.difficulty === "string"
          ? qualityReview.metadata.difficulty
          : null,
    tags: Array.isArray(metadata?.tags)
      ? metadata.tags.filter((item): item is string => typeof item === "string")
      : Array.isArray(qualityReviewMetadata.tags)
        ? qualityReviewMetadata.tags.filter((item): item is string => typeof item === "string")
        : [],
    telemetryScore:
      numberOrNull(qualityReviewHeuristics.telemetry_score) ??
      numberOrNull(metadata?.telemetry_score),
  };
}

function buildDecisionModel(params: {
  proposal: ProposalRow;
  finding: FindingRow | null;
  exerciseContext: ExerciseContext | null;
}): ProposalDecisionModel {
  const { proposal, finding, exerciseContext } = params;

  if (proposal.proposal_type === "report") {
    return {
      problem: finding?.description || "Existe um sinal oficial que pode justificar revisão humana.",
      impact: "Baixo a médio. Esta proposal serve sobretudo para registo auditável e follow-up controlado.",
      priority: proposal.risk_level === "high" || proposal.risk_level === "critical" ? "high" : "medium",
      systemRecommendation:
        "Aprovar se concordas que este sinal deve entrar no backlog formal. Rejeitar se não vês relevância prática para a app.",
      approveOutcome: "Validar este sinal e fechá-lo de forma auditável.",
      rejectOutcome: "Descartar a evidência (ruído) e encerrar o caso.",
    };
  }

  if (exerciseContext) {
    const hasOnlyTelemetryIssue =
      exerciseContext.issues.length === 1 &&
      exerciseContext.issues[0].toLowerCase().includes("telemetria");
    const score = exerciseContext.finalScore ?? 0.5;

    if (hasOnlyTelemetryIssue && score >= 0.7) {
      return {
        problem:
          "O sistema não encontrou erro matemático ou curricular claro; falta sobretudo evidência de uso real para confirmar se a dificuldade atribuída está correta.",
        impact:
          "Baixo. O exercício parece utilizável, mas a classificação de dificuldade ainda não está bem suportada por dados reais.",
        priority: "low",
        systemRecommendation:
          "Na maioria dos casos, manter o exercício como está e apenas acompanhá-lo. Aprovar só se quiseres pôr este caso numa fila de revisão de dificuldade/metadados.",
        approveOutcome:
          "O caso entra numa fila controlada de revisão editorial ou de metadados. Não há edição automática do conteúdo.",
        rejectOutcome:
          "O exercício fica como está e o caso é encerrado até existir evidência nova mais forte.",
      };
    }

    if (score < 0.6) {
      return {
        problem:
          "O exercício teve score baixo no auditor, o que indica risco real de clareza insuficiente, metadados fracos ou classificação de dificuldade pouco fiável.",
        impact:
          "Médio. Este tipo de caso pode afetar a experiência do aluno, especialmente se a pergunta aparecer com frequência no estudo.",
        priority: "medium",
        systemRecommendation:
          "Aprovar se queres colocar este exercício numa revisão humana concreta. É um caso com sinal suficientemente forte para merecer atenção.",
        approveOutcome:
          "O exercício entra numa fila de revisão controlada para decidir se deve ser mantido, reclassificado ou reescrito.",
        rejectOutcome:
          "O caso é fechado e assumes que, por agora, o sinal não justifica trabalho adicional.",
      };
    }

    return {
      problem:
        "O auditor sinalizou este exercício como caso limítrofe: não há necessariamente um erro claro, mas existe incerteza suficiente para justificar avaliação humana.",
      impact:
        "Baixo a médio. Pode ser apenas uma melhoria de metadados/dificuldade, não uma falha crítica de conteúdo.",
      priority: proposal.risk_level === "low" ? "low" : "medium",
      systemRecommendation:
        "Aprovar se queres tratar este caso como melhoria incremental da base de dados. Rejeitar se preferes concentrar o esforço só nos sinais mais fortes.",
      approveOutcome:
        "O caso entra numa fila manual de revisão; depois decides se manténs, reclassificas ou reescreves o exercício.",
      rejectOutcome:
        "O exercício permanece inalterado e a equipa deixa de acompanhar este caso até surgir nova evidência.",
    };
  }

  let defaultApproveOutcome = "Avança para a próxima fase automática do workflow.";
  let defaultRejectOutcome = "O caso é encerrado e nenhuma alteração será executada.";

  if (proposal.proposal_type === "execution_plan") {
    defaultApproveOutcome = "Avança o item para uma fila de revisão ou edição humana controlada.";
    defaultRejectOutcome = "Rejeita o plano. O processo automático para por aqui e não há lugar a curadoria humana extra.";
  } else if (proposal.proposal_type === "content_update") {
    defaultApproveOutcome = "Aplica as alterações curriculares e de dados diretamente no sistema do Wolfie.";
    defaultRejectOutcome = "Bloqueia a mudança sugerida. O currículo/conteúdo manter-se-á como estava.";
  }

  return {
    problem: finding?.description || "Existe um sinal ou proposta em aberto que bloqueia a operação automática.",
    impact: "Ainda não categorizado ou múltiplo.",
    priority: proposal.risk_level === "high" || proposal.risk_level === "critical" ? "high" : "medium",
    systemRecommendation: "Aprovar se o plano ou sinal parece correto e deves materializar o passo seguinte.",
    approveOutcome: defaultApproveOutcome,
    rejectOutcome: defaultRejectOutcome,
  };
}

async function loadWorkflowMap(workflowIds?: string[]) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("agent_workflows")
    .select("id, code, name, description, category, schedule_kind, schedule_cron, risk_level, is_active")
    .order("name", { ascending: true });

  if (workflowIds && workflowIds.length > 0) {
    query = query.in("id", workflowIds);
  }

  const { data, error } = await query;
  if (error) throw error;

  return indexById((data ?? []) as WorkflowRow[]);
}

function mapRuns(runs: RunRow[], workflowMap: Map<string, WorkflowRow>) {
  return runs.map((run) => {
    const workflow = workflowMap.get(run.workflow_id);

    return {
      ...run,
      workflowName: workflow?.name ?? run.workflow_id,
      workflowCode: workflow?.code ?? "unknown",
      riskLevel: workflow?.risk_level ?? "medium",
      scheduleKind: workflow?.schedule_kind ?? null,
      scheduleCron: workflow?.schedule_cron ?? null,
    };
  });
}

function mapFindings(findings: FindingRow[], runMap: Map<string, RunRow>, workflowMap: Map<string, WorkflowRow>) {
  return findings.map((finding) => {
    const run = runMap.get(finding.run_id);
    const workflow = run ? workflowMap.get(run.workflow_id) : null;

    return {
      ...finding,
      runStatus: run?.status ?? null,
      workflowName: workflow?.name ?? "Workflow desconhecido",
      workflowCode: workflow?.code ?? "unknown",
      nextStep: getFindingNextStep(finding),
    };
  });
}

function humanizeProposalTitle(proposal: ProposalRow, contextLabel?: string | null) {
  if (proposal.proposal_type === "execution_plan" && contextLabel) {
    return `Rever ${contextLabel}`;
  }

  return proposal.title;
}

function getFindingNextStep(finding: FindingRow) {
  if (finding.status === "pending_review") return "À espera de proposal ou decisão humana";
  if (finding.status === "pending_proposal") return "Converter em proposal";
  if (finding.status === "triaged") return "Aguardar mais sinais";

  if (finding.finding_type === "exercise_issue") {
    const recommendation =
      typeof finding.metadata?.recommendation === "string" ? finding.metadata.recommendation : null;
    const finalScore = numberOrNull(finding.metadata?.final_score);

    if (recommendation === "rewrite" || recommendation === "replace") return "Criar proposal de revisão";
    if (finalScore != null && finalScore < 0.6) return "Criar proposal de revisão";
    return "Monitorizar ou converter em proposal";
  }

  if (finding.finding_type === "curriculum_gap" || finding.finding_type === "content_gap") {
    return "Avaliar impacto curricular";
  }

  return "Triar manualmente";
}

function getQualityReviewOperationalSummary(review: QualityReviewRow) {
  if (review.issues.some((issue) => issue.toLowerCase().includes("telemetria"))) {
    return {
      problem: "Dificuldade ainda não validada por uso real",
      impact: "Baixo",
      action: "Manter e observar",
    };
  }

  if ((review.final_score ?? 1) < 0.6) {
    return {
      problem: "Qualidade do item abaixo do esperado",
      impact: "Médio",
      action: "Revisão humana recomendada",
    };
  }

  if (review.recommendation === "keep") {
    return {
      problem: "Sem problema relevante detetado",
      impact: "Baixo",
      action: "Sem ação",
    };
  }

  return {
    problem: "Caso limítrofe com incerteza",
    impact: "Baixo a médio",
    action: "Rever se houver capacidade",
  };
}

function formatScheduleSummary(workflow: WorkflowRow) {
  const scheduledLabelByCode: Record<string, string> = {
    "official-monitor": "Segunda-feira, 08:00",
    "coverage-profiler": "Terça-feira, 08:00",
    "case-builder": "Sexta-feira, 09:00",
    "brief-generator": "Sexta-feira, 10:00",
    "draft-generator": "Manual após aceitação",
  };

  if (!workflow.is_active) {
    return {
      modeLabel: "Pausado",
      cadenceLabel: "Sem execução ativa",
      note: "Workflow inativo.",
      isRecurring: false,
    };
  }

  if (!workflow.schedule_kind || workflow.schedule_kind === "manual") {
    const recommendedCadence =
      workflow.code === "official-monitor"
        ? "Recomendado: semanal"
        : workflow.code === "coverage-profiler"
          ? "Recomendado: semanal"
        : workflow.code === "exercise-auditor"
          ? "Recomendado: mensal"
          : workflow.code === "proposal-engine"
            ? "Recomendado: após monitor/auditor"
            : workflow.code === "curriculum-diff"
              ? "Recomendado: após official-monitor"
              : workflow.code === "draft-generator"
                ? "Manual após aceitação"
              : "Manual";

    return {
      modeLabel: "Manual",
      cadenceLabel: recommendedCadence,
      note: "Ainda não existe schedule automático configurado na BD.",
      isRecurring: false,
    };
  }

  return {
    modeLabel: "Automático",
    cadenceLabel: scheduledLabelByCode[workflow.code] ?? workflow.schedule_cron ?? workflow.schedule_kind,
    note: "Workflow com schedule semanal persistido na BD.",
    isRecurring: true,
  };
}

export async function getDashboardData() {
  const supabase = getSupabaseAdmin();

  const [
    workflowsResult,
    runsResult,
    findingsResult,
    pendingFindingsResult,
    pendingProposalsResult,
    approvedProposalsResult,
    executedProposalsResult,
  ] = await Promise.all([
      supabase
        .from("agent_workflows")
        .select("id, code, name, description, category, schedule_kind, schedule_cron, risk_level, is_active")
        .order("name", { ascending: true }),
      supabase
        .from("agent_runs")
        .select("id, workflow_id, trigger_type, status, summary, input_payload, output_payload, error_log, created_at, started_at, finished_at")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("agent_findings")
        .select("id, run_id, finding_type, severity, status, title, description, confidence, affected_theme, affected_subtopic, source_snapshot_ids, metadata, created_at")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("agent_findings")
        .select("id", { count: "exact", head: true })
        .in("status", ["new", "triaged", "pending_proposal", "pending_review"]),
      supabase
        .from("agent_proposals")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending_review", "needs_revision"]),
      supabase
        .from("agent_proposals")
        .select("id", { count: "exact", head: true })
        .eq("status", "approved"),
      supabase
        .from("agent_proposals")
        .select("id", { count: "exact", head: true })
        .eq("status", "executed"),
    ]);

  if (workflowsResult.error) throw workflowsResult.error;
  if (runsResult.error) throw runsResult.error;
  if (findingsResult.error) throw findingsResult.error;
  if (pendingFindingsResult.error) throw pendingFindingsResult.error;
  if (pendingProposalsResult.error) throw pendingProposalsResult.error;
  if (approvedProposalsResult.error) throw approvedProposalsResult.error;
  if (executedProposalsResult.error) throw executedProposalsResult.error;

  const workflows = ((workflowsResult.data ?? []) as WorkflowRow[]).map((workflow) => ({
    ...workflow,
    scheduleSummary: formatScheduleSummary(workflow),
  }));
  const runs = (runsResult.data ?? []) as RunRow[];
  const findings = (findingsResult.data ?? []) as FindingRow[];

  const workflowMap = indexById(workflows);
  const runMap = indexById(runs);
  const enrichedRuns = mapRuns(runs, workflowMap);
  const enrichedFindings = mapFindings(findings, runMap, workflowMap);

  return {
    metrics: {
      activeWorkflows: workflows.filter((workflow) => workflow.is_active).length,
      totalWorkflows: workflows.length,
      failedRuns: runs.filter((run) => run.status === "failed").length,
      pendingFindings: pendingFindingsResult.count ?? 0,
      pendingProposals: pendingProposalsResult.count ?? 0,
      approvedProposals: approvedProposalsResult.count ?? 0,
      executedProposals: executedProposalsResult.count ?? 0,
    },
    workflows,
    recentRuns: enrichedRuns,
    recentFindings: enrichedFindings,
  };
}

export async function listRuns() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("agent_runs")
    .select("id, workflow_id, trigger_type, status, summary, input_payload, output_payload, error_log, created_at, started_at, finished_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  const runs = (data ?? []) as RunRow[];
  const workflowMap = await loadWorkflowMap([...new Set(runs.map((run) => run.workflow_id))]);
  return mapRuns(runs, workflowMap);
}

export async function getRunDetail(runId: string) {
  const supabase = getSupabaseAdmin();

  const [runResult, stepsResult, snapshotsResult, findingsResult] = await Promise.all([
    supabase
      .from("agent_runs")
      .select("id, workflow_id, trigger_type, status, summary, input_payload, output_payload, error_log, created_at, started_at, finished_at")
      .eq("id", runId)
      .maybeSingle(),
    supabase
      .from("agent_run_steps")
      .select("id, run_id, step_key, step_order, status, output_payload, error_log, started_at")
      .eq("run_id", runId)
      .order("step_order", { ascending: true }),
    supabase
      .from("agent_source_snapshots")
      .select("id, run_id, source_name, source_type, url, title, fetched_at")
      .eq("run_id", runId)
      .order("fetched_at", { ascending: false }),
    supabase
      .from("agent_findings")
      .select("id, run_id, finding_type, severity, status, title, description, confidence, affected_theme, affected_subtopic, source_snapshot_ids, metadata, created_at")
      .eq("run_id", runId)
      .order("created_at", { ascending: false }),
  ]);

  if (runResult.error) throw runResult.error;
  if (stepsResult.error) throw stepsResult.error;
  if (snapshotsResult.error) throw snapshotsResult.error;
  if (findingsResult.error) throw findingsResult.error;

  const run = runResult.data as RunRow | null;
  if (!run) return null;

  const workflowMap = await loadWorkflowMap([run.workflow_id]);
  const workflow = workflowMap.get(run.workflow_id);
  const [enrichedRun] = mapRuns([run], workflowMap);

  return {
    ...enrichedRun,
    workflowName: workflow?.name ?? enrichedRun.workflowName,
    riskLevel: workflow?.risk_level ?? "medium",
    steps: (stepsResult.data ?? []) as StepRow[],
    snapshots: (snapshotsResult.data ?? []) as SnapshotRow[],
    findings: (findingsResult.data ?? []) as FindingRow[],
  };
}

export async function listFindings() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("agent_findings")
    .select("id, run_id, finding_type, severity, status, title, description, confidence, affected_theme, affected_subtopic, source_snapshot_ids, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  const findings = (data ?? []) as FindingRow[];
  const runIds = [...new Set(findings.map((finding) => finding.run_id))];
  const { data: runsData, error: runsError } = await supabase
    .from("agent_runs")
    .select("id, workflow_id, trigger_type, status, summary, input_payload, output_payload, error_log, created_at, started_at, finished_at")
    .in("id", runIds.length > 0 ? runIds : ["00000000-0000-0000-0000-000000000000"]);

  if (runsError) throw runsError;

  const runs = (runsData ?? []) as RunRow[];
  const workflowMap = await loadWorkflowMap([...new Set(runs.map((run) => run.workflow_id))]);
  const runMap = indexById(runs);

  return mapFindings(findings, runMap, workflowMap);
}

export async function listCurriculumFindings() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("agent_findings")
    .select("id, run_id, finding_type, severity, status, title, description, confidence, affected_theme, affected_subtopic, source_snapshot_ids, metadata, created_at")
    .in("finding_type", ["curriculum_gap", "content_gap"])
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  const findings = (data ?? []) as FindingRow[];
  const runIds = [...new Set(findings.map((finding) => finding.run_id))];
  const { data: runsData, error: runsError } = await supabase
    .from("agent_runs")
    .select("id, workflow_id, trigger_type, status, summary, input_payload, output_payload, error_log, created_at, started_at, finished_at")
    .in("id", runIds.length > 0 ? runIds : ["00000000-0000-0000-0000-000000000000"]);

  if (runsError) throw runsError;

  const runs = (runsData ?? []) as RunRow[];
  const workflowMap = await loadWorkflowMap([...new Set(runs.map((run) => run.workflow_id))]);
  const runMap = indexById(runs);

  return mapFindings(findings, runMap, workflowMap);
}

export async function getFindingDetail(findingId: string) {
  const supabase = getSupabaseAdmin();
  const { data: findingData, error: findingError } = await supabase
    .from("agent_findings")
    .select("id, run_id, finding_type, severity, status, title, description, confidence, affected_theme, affected_subtopic, source_snapshot_ids, metadata, created_at")
    .eq("id", findingId)
    .maybeSingle();

  if (findingError) throw findingError;

  const finding = findingData as FindingRow | null;
  if (!finding) return null;

  const { data: runData, error: runError } = await supabase
    .from("agent_runs")
    .select("id, workflow_id, trigger_type, status, summary, input_payload, output_payload, error_log, created_at, started_at, finished_at")
    .eq("id", finding.run_id)
    .maybeSingle();

  if (runError) throw runError;

  const run = runData as RunRow | null;
  const workflowMap = run ? await loadWorkflowMap([run.workflow_id]) : new Map<string, WorkflowRow>();
  const runMap = run ? new Map([[run.id, run]]) : new Map<string, RunRow>();
  const [enrichedFinding] = mapFindings([finding], runMap, workflowMap);

  let snapshots: SnapshotRow[] = [];
  if (finding.source_snapshot_ids.length > 0) {
    const { data: snapshotData, error: snapshotError } = await supabase
      .from("agent_source_snapshots")
      .select("id, run_id, source_name, source_type, url, title, fetched_at")
      .in("id", finding.source_snapshot_ids);

    if (snapshotError) throw snapshotError;
    snapshots = (snapshotData ?? []) as SnapshotRow[];
  }

  return {
    ...enrichedFinding,
    snapshots,
  };
}

export async function listProposals(options?: ProposalListOptions) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("agent_proposals")
    .select("id, run_id, finding_id, title, proposal_type, risk_level, status, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (options?.statuses && options.statuses.length > 0) {
    query = query.in("status", options.statuses);
  }

  const { data, error } = await query;

  if (error) throw error;

  const proposals = (data ?? []) as ProposalRow[];
  const findingIds = proposals
    .map((proposal) => proposal.finding_id)
    .filter((findingId): findingId is string => Boolean(findingId));

  if (findingIds.length === 0) {
    return proposals.map((proposal) => ({
      ...proposal,
      findingTitle: null,
      contextLabel: proposal.finding_id ?? "n/a",
      decisionHint: null,
      humanTitle: humanizeProposalTitle(proposal, null),
    }));
  }

  const { data: findingsData, error: findingsError } = await supabase
    .from("agent_findings")
    .select("id, title, finding_type, description, metadata")
    .in("id", findingIds);

  if (findingsError) throw findingsError;

  const findingsMap = new Map(
    ((findingsData ?? []) as Array<{ id: string; title: string; finding_type: string; description: string; metadata: Record<string, unknown> }>).map(
      (finding) => [finding.id, finding],
    ),
  );

  return proposals.map((proposal) => {
    const finding = proposal.finding_id ? findingsMap.get(proposal.finding_id) : null;
    const exerciseContext = finding ? buildExerciseContext(finding.metadata) : null;
    
    // Create a mock FindingRow just enough for buildDecisionModel
    const findingMock = finding ? { ...finding, description: finding.description } as unknown as FindingRow : null;
    const decisionModel = buildDecisionModel({ proposal, finding: findingMock, exerciseContext });

    return {
      ...proposal,
      findingTitle: finding?.title ?? null,
      contextLabel: exerciseContext
        ? `${exerciseContext.sourceLabel}: ${exerciseContext.exerciseTitle ?? exerciseContext.exerciseId ?? "sem título"}`
        : finding?.title ?? proposal.finding_id ?? "n/a",
      decisionHint: exerciseContext
        ? `Score ${exerciseContext.finalScore?.toFixed(2) ?? "n/a"} · ${exerciseContext.recommendation ?? "sem recommendation"}`
        : null,
      humanTitle: humanizeProposalTitle(
        proposal,
        exerciseContext
          ? `${exerciseContext.sourceLabel}: ${exerciseContext.exerciseTitle ?? exerciseContext.exerciseId ?? "sem título"}`
          : finding?.title ?? null,
      ),
      decisionModel
    };
  });
}

export async function listQualityReviews() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("exercise_quality_reviews")
    .select("id, run_id, exercise_source, exercise_id, final_score, recommendation, strengths, issues, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  return ((data ?? []) as QualityReviewRow[]).map((review) => ({
    ...review,
    operationalSummary: getQualityReviewOperationalSummary(review),
  }));
}

export async function getProposalDetail(proposalId: string) {
  const supabase = getSupabaseAdmin();

  const [proposalResult, reviewsResult] = await Promise.all([
    supabase
      .from("agent_proposals")
      .select("id, run_id, finding_id, title, proposal_type, risk_level, status, rationale, markdown_draft, sql_draft, structured_payload, source_snapshot_ids, metadata, reviewed_at, executed_at, created_at")
      .eq("id", proposalId)
      .maybeSingle(),
    supabase
      .from("agent_reviews")
      .select("id, proposal_id, reviewer_user_id, reviewer_type, decision, notes, metadata, created_at")
      .eq("proposal_id", proposalId)
      .order("created_at", { ascending: false }),
  ]);

  if (proposalResult.error) throw proposalResult.error;
  if (reviewsResult.error) throw reviewsResult.error;

  const proposal = proposalResult.data as ProposalRow | null;
  if (!proposal) return null;

  const findingId = proposal.finding_id ?? null;
  const runId = proposal.run_id ?? null;

  const [finding, run, snapshots] = await Promise.all([
    findingId ? getFindingDetail(findingId) : Promise.resolve(null),
    runId ? getRunDetail(runId) : Promise.resolve(null),
    proposal.source_snapshot_ids && proposal.source_snapshot_ids.length > 0
      ? supabase
          .from("agent_source_snapshots")
          .select("id, run_id, source_name, source_type, url, title, fetched_at")
          .in("id", proposal.source_snapshot_ids)
          .then((result) => {
            if (result.error) throw result.error;
            return (result.data ?? []) as SnapshotRow[];
          })
      : Promise.resolve([] as SnapshotRow[]),
  ]);

  let qualityReview: QualityReviewRow | null = null;
  if (finding?.finding_type === "exercise_issue") {
    const exerciseSource =
      typeof finding.metadata?.exercise_source === "string" ? finding.metadata.exercise_source : null;
    const exerciseId =
      typeof finding.metadata?.exercise_id === "string" ? finding.metadata.exercise_id : null;

    if (exerciseSource && exerciseId) {
      const { data: qualityReviewData, error: qualityReviewError } = await supabase
        .from("exercise_quality_reviews")
        .select("id, run_id, exercise_source, exercise_id, final_score, recommendation, strengths, issues, metadata, created_at")
        .eq("exercise_source", exerciseSource)
        .eq("exercise_id", exerciseId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (qualityReviewError) throw qualityReviewError;
      qualityReview = (qualityReviewData as QualityReviewRow | null) ?? null;
    }
  }

  const exerciseContext = finding ? buildExerciseContext(finding.metadata, qualityReview) : null;
  const decisionModel = buildDecisionModel({
    proposal,
    finding: finding as FindingRow | null,
    exerciseContext,
  });

  return {
    ...proposal,
    finding,
    run,
    snapshots,
    exerciseContext,
    decisionModel,
    reviews: (reviewsResult.data ?? []) as ReviewRow[],
  };
}

export async function listWorkflows() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("agent_workflows")
    .select("id, code, name, description, category, schedule_kind, schedule_cron, risk_level, is_active")
    .order("name", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as WorkflowRow[]).map((workflow) => ({
    ...workflow,
    scheduleSummary: formatScheduleSummary(workflow),
  }));
}

type ReviewBriefRow = {
  id: string;
  run_id: string | null;
  period_type: "weekly" | "monthly" | "manual";
  title: string;
  summary: string;
  status: "draft" | "published" | "completed" | "archived";
  coverage_start: string | null;
  coverage_end: string | null;
  item_count: number;
  metadata: Record<string, unknown>;
  published_at: string | null;
  completed_at: string | null;
  created_at: string;
};

type ReviewBriefItemRow = {
  id: string;
  brief_id: string;
  proposal_id: string | null;
  finding_id: string | null;
  category: "editorial" | "curricular" | "operational";
  title: string;
  problem: string;
  impact: string;
  recommendation: string;
  suggested_action_type:
    | "observe_only"
    | "reclassify_difficulty"
    | "rewrite_exercise"
    | "improve_explanation"
    | "add_variants"
    | "update_curricular_alignment"
    | "create_new_content"
    | "investigate_system"
    | null;
  suggested_change_summary: string | null;
  expected_outcome: string | null;
  apply_mode: "observe_only" | "manual_package" | "staging_update" | null;
  evidence_summary: string | null;
  priority: "low" | "medium" | "high";
  decision_status: "pending" | "approved" | "deferred" | "ignored" | "executed";
  sort_order: number;
  metadata: Record<string, unknown>;
  created_at: string;
};

type ReviewCaseRow = {
  id: string;
  brief_id: string;
  case_key: string;
  case_type: "official_update" | "coverage_gap" | "taxonomy_imbalance" | "legacy_editorial";
  category: "editorial" | "curricular" | "operational";
  source_kind: string | null;
  source_ref: string | null;
  action_type: string | null;
  theme_name: string | null;
  subtopic_name: string | null;
  title: string;
  summary: string;
  problem: string;
  impact: string;
  change_summary: string;
  expected_outcome: string;
  evidence_summary: string | null;
  priority: "low" | "medium" | "high";
  status: "pending" | "completed" | "archived";
  decision_status: "pending" | "accepted" | "deferred" | "ignored";
  reviewed_at: string | null;
  reviewer_label: string | null;
  review_notes: string | null;
  item_count: number;
  pending_item_count: number;
  draft_status: "none" | "ready";
  draft_generated_at: string | null;
  draft_package: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
};

type ReviewCaseItemRow = {
  case_id: string;
  brief_item_id: string;
  sort_order: number;
};

type PersistedReviewCase = {
  id: string;
  category: "editorial" | "curricular" | "operational";
  actionType: string | null;
  title: string;
  summary: string;
  problem: string;
  impact: string;
  changeSummary: string;
  expectedOutcome: string;
  pendingCount: number;
  highPriorityCount: number;
  itemIds: string[];
  examples: string[];
  nextStepLabel: string;
  metadata?: Record<string, unknown>;
  decisionStatus: "pending" | "accepted" | "deferred" | "ignored";
  humanStatus: string;
  draftStatus: "none" | "ready";
  draftGeneratedAt: string | null;
  draftPackage: Record<string, unknown> | null;
};

function getBriefItemDecisionCopy(item: ReviewBriefItemRow) {
  if (item.suggested_action_type === "observe_only") {
    return {
      approveLabel: "Aceitar observação",
      deferLabel: "Ver mais tarde",
      ignoreLabel: "Descartar",
    };
  }

  if (item.suggested_action_type === "reclassify_difficulty") {
    return {
      approveLabel: "Aceitar reclassificação",
      deferLabel: "Observar mais",
      ignoreLabel: "Descartar",
    };
  }

  if (item.suggested_action_type === "rewrite_exercise" || item.suggested_action_type === "improve_explanation") {
    return {
      approveLabel: "Aceitar melhoria",
      deferLabel: "Adiar revisão",
      ignoreLabel: "Descartar",
    };
  }

  if (item.suggested_action_type === "add_variants") {
    return {
      approveLabel: "Aceitar variantes",
      deferLabel: "Adiar",
      ignoreLabel: "Descartar",
    };
  }

  if (item.suggested_action_type === "update_curricular_alignment" || item.suggested_action_type === "create_new_content") {
    return {
      approveLabel: "Aceitar atualização",
      deferLabel: "Manter em observação",
      ignoreLabel: "Descartar",
    };
  }

  return {
    approveLabel: "Aceitar melhoria",
    deferLabel: "Adiar",
    ignoreLabel: "Descartar",
  };
}

function getBriefItemHumanStatus(status: ReviewBriefItemRow["decision_status"]) {
  if (status === "pending") return "Por decidir";
  if (status === "approved") return "Aceite";
  if (status === "deferred") return "Em observação";
  if (status === "ignored") return "Descartado";
  return "Executado";
}

function getBriefItemChangeSummary(item: ReviewBriefItemRow) {
  return item.suggested_change_summary || item.recommendation;
}

function getBriefItemExpectedOutcome(item: ReviewBriefItemRow) {
  if (item.expected_outcome) return item.expected_outcome;

  if (item.suggested_action_type === "observe_only") {
    return "Mais evidência antes de qualquer alteração ao conteúdo.";
  }

  if (item.category === "curricular") {
    return "Conteúdo do Wolfie mais alinhado com o programa e os exames.";
  }

  if (item.category === "editorial") {
    return "Melhoria concreta de qualidade, clareza ou utilidade pedagógica.";
  }

  return "Melhoria da robustez operacional do sistema.";
}

function countBriefItems(items: ReviewBriefItemRow[]) {
  return {
    pending: items.filter((item) => item.decision_status === "pending").length,
    approved: items.filter((item) => item.decision_status === "approved").length,
    deferred: items.filter((item) => item.decision_status === "deferred").length,
    ignored: items.filter((item) => item.decision_status === "ignored").length,
    editorial: items.filter((item) => item.category === "editorial").length,
    curricular: items.filter((item) => item.category === "curricular").length,
    operational: items.filter((item) => item.category === "operational").length,
    highPriority: items.filter((item) => item.priority === "high").length,
  };
}

function normalizePersistedCase(raw: unknown): PersistedReviewCase | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  if (typeof row.id !== "string" || typeof row.title !== "string") return null;

  const decisionStatus =
    row.decisionStatus === "accepted" || row.decisionStatus === "deferred" || row.decisionStatus === "ignored"
      ? row.decisionStatus
      : "pending";

  return {
    id: row.id,
    category:
      row.category === "curricular" || row.category === "operational" ? row.category : "editorial",
    actionType: typeof row.actionType === "string" ? row.actionType : null,
    title: row.title,
    summary: typeof row.summary === "string" ? row.summary : "",
    problem: typeof row.problem === "string" ? row.problem : "",
    impact: typeof row.impact === "string" ? row.impact : "",
    changeSummary: typeof row.changeSummary === "string" ? row.changeSummary : "",
    expectedOutcome: typeof row.expectedOutcome === "string" ? row.expectedOutcome : "",
    pendingCount: typeof row.pendingCount === "number" ? row.pendingCount : 0,
    highPriorityCount: typeof row.highPriorityCount === "number" ? row.highPriorityCount : 0,
    itemIds: Array.isArray(row.itemIds) ? row.itemIds.filter((item): item is string => typeof item === "string") : [],
    examples: Array.isArray(row.examples) ? row.examples.filter((item): item is string => typeof item === "string") : [],
    nextStepLabel: typeof row.nextStepLabel === "string" ? row.nextStepLabel : "Abrir caso",
    metadata: row.metadata && typeof row.metadata === "object" ? (row.metadata as Record<string, unknown>) : {},
    decisionStatus,
    humanStatus:
      decisionStatus === "accepted"
        ? "Aceite para proposta"
        : decisionStatus === "deferred"
          ? "Adiado"
          : decisionStatus === "ignored"
          ? "Descartado"
            : "Por decidir",
    draftStatus: row.draftStatus === "ready" ? "ready" : "none",
    draftGeneratedAt: typeof row.draftGeneratedAt === "string" ? row.draftGeneratedAt : null,
    draftPackage:
      row.draftPackage && typeof row.draftPackage === "object"
        ? (row.draftPackage as Record<string, unknown>)
        : null,
  };
}

function deriveReviewCases(brief: ReviewBriefRow, items: Array<ReviewBriefItemRow & {
  changeSummary: string;
  expectedOutcome: string;
  humanStatus: string;
  decisionCopy: ReturnType<typeof getBriefItemDecisionCopy>;
}>) {
  const persistedCasesRaw = Array.isArray(brief.metadata?.case_groups) ? brief.metadata.case_groups : [];
  const persistedCases = persistedCasesRaw
    .map((entry) => normalizePersistedCase(entry))
    .filter((entry): entry is PersistedReviewCase => Boolean(entry));

  if (persistedCases.length > 0) {
    return persistedCases.map((reviewCase) => ({
      ...reviewCase,
      items: items.filter((item) => reviewCase.itemIds.includes(item.id)),
    })).filter((reviewCase) => reviewCase.decisionStatus !== "ignored");
  }

  return groupReviewItemsIntoBatches(items).map((reviewCase) => ({
    ...reviewCase,
    items: items.filter((item) => reviewCase.itemIds.includes(item.id)),
    decisionStatus: "pending" as const,
    humanStatus: "Por decidir",
    draftStatus: "none" as const,
    draftGeneratedAt: null,
    draftPackage: null,
  }));
}

function deriveStoredReviewCases(params: {
  brief: ReviewBriefRow;
  items: Array<ReviewBriefItemRow & {
    changeSummary: string;
    expectedOutcome: string;
    humanStatus: string;
    decisionCopy: ReturnType<typeof getBriefItemDecisionCopy>;
  }>;
  cases: ReviewCaseRow[];
  caseItems: ReviewCaseItemRow[];
}) {
  const { brief, items, cases, caseItems } = params;
  const itemsById = new Map(items.map((item) => [item.id, item]));
  const caseItemsByCase = caseItems.reduce((acc, row) => {
    const current = acc.get(row.case_id) ?? [];
    current.push(row);
    acc.set(row.case_id, current);
    return acc;
  }, new Map<string, ReviewCaseItemRow[]>());

  const activeCases = cases.filter((reviewCase) => reviewCase.status !== "archived");
  if (activeCases.length === 0) {
    return deriveReviewCases(brief, items);
  }

  return activeCases.map((reviewCase) => {
    const relatedItems = (caseItemsByCase.get(reviewCase.id) ?? [])
      .sort((left, right) => left.sort_order - right.sort_order)
      .map((row) => itemsById.get(row.brief_item_id))
      .filter((item): item is (typeof items)[number] => Boolean(item));

    return {
      id: reviewCase.id,
      category: reviewCase.category,
      actionType: reviewCase.action_type,
      title: reviewCase.title,
      summary: reviewCase.summary,
      problem: reviewCase.problem,
      impact: reviewCase.impact,
      changeSummary: reviewCase.change_summary,
      expectedOutcome: reviewCase.expected_outcome,
      pendingCount: reviewCase.pending_item_count,
      highPriorityCount: reviewCase.priority === "high" ? reviewCase.item_count : 0,
      itemIds: relatedItems.map((item) => item.id),
      examples:
        Array.isArray(reviewCase.metadata?.examples)
          ? reviewCase.metadata.examples.filter((item): item is string => typeof item === "string")
          : relatedItems.slice(0, 3).map((item) => item.title),
      nextStepLabel: "Abrir caso",
      metadata: reviewCase.metadata ?? {},
      decisionStatus: reviewCase.decision_status,
      humanStatus:
        reviewCase.decision_status === "accepted"
          ? "Aceite para proposta"
          : reviewCase.decision_status === "deferred"
            ? "Adiado"
            : reviewCase.decision_status === "ignored"
              ? "Descartado"
              : "Por decidir",
      draftStatus: reviewCase.draft_status,
      draftGeneratedAt: reviewCase.draft_generated_at,
      draftPackage:
        reviewCase.draft_status === "ready" && reviewCase.draft_package && Object.keys(reviewCase.draft_package).length > 0
          ? reviewCase.draft_package
          : null,
      items: relatedItems,
    };
  });
}

export async function listReviewBriefs() {
  const supabase = getSupabaseAdmin();
  const { data: briefsData, error: briefsError } = await supabase
    .from("review_briefs")
    .select("id, run_id, period_type, title, summary, status, coverage_start, coverage_end, item_count, metadata, published_at, completed_at, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (briefsError) throw briefsError;

  const briefs = (briefsData ?? []) as ReviewBriefRow[];
  const briefIds = briefs.map((brief) => brief.id);

  let itemsByBrief = new Map<string, ReviewBriefItemRow[]>();
  if (briefIds.length > 0) {
    const { data: itemsData, error: itemsError } = await supabase
      .from("review_brief_items")
      .select("id, brief_id, proposal_id, finding_id, category, title, problem, impact, recommendation, suggested_action_type, suggested_change_summary, expected_outcome, apply_mode, evidence_summary, priority, decision_status, sort_order, metadata, created_at")
      .in("brief_id", briefIds)
      .order("sort_order", { ascending: true });

    if (itemsError) throw itemsError;

    itemsByBrief = (itemsData ?? []).reduce((acc, item) => {
      const typedItem = item as ReviewBriefItemRow;
      const current = acc.get(typedItem.brief_id) ?? [];
      current.push(typedItem);
      acc.set(typedItem.brief_id, current);
      return acc;
    }, new Map<string, ReviewBriefItemRow[]>());
  }

  let casesByBrief = new Map<string, ReviewCaseRow[]>();
  let caseItemsByCase = new Map<string, ReviewCaseItemRow[]>();
  if (briefIds.length > 0) {
    const { data: casesData, error: casesError } = await supabase
      .from("review_cases")
      .select("id, brief_id, case_key, case_type, category, source_kind, source_ref, action_type, theme_name, subtopic_name, title, summary, problem, impact, change_summary, expected_outcome, evidence_summary, priority, status, decision_status, reviewed_at, reviewer_label, review_notes, item_count, pending_item_count, draft_status, draft_generated_at, draft_package, metadata, created_at")
      .in("brief_id", briefIds)
      .order("created_at", { ascending: true });

    if (casesError) throw casesError;

    const cases = (casesData ?? []) as ReviewCaseRow[];
    casesByBrief = cases.reduce((acc, reviewCase) => {
      const current = acc.get(reviewCase.brief_id) ?? [];
      current.push(reviewCase);
      acc.set(reviewCase.brief_id, current);
      return acc;
    }, new Map<string, ReviewCaseRow[]>());

    const caseIds = cases.map((reviewCase) => reviewCase.id);
    if (caseIds.length > 0) {
      const { data: caseItemsData, error: caseItemsError } = await supabase
        .from("review_case_items")
        .select("case_id, brief_item_id, sort_order")
        .in("case_id", caseIds);

      if (caseItemsError) throw caseItemsError;

      caseItemsByCase = ((caseItemsData ?? []) as ReviewCaseItemRow[]).reduce((acc, row) => {
        const current = acc.get(row.case_id) ?? [];
        current.push(row);
        acc.set(row.case_id, current);
        return acc;
      }, new Map<string, ReviewCaseItemRow[]>());
    }
  }

  return briefs.map((brief) => {
    const items = (itemsByBrief.get(brief.id) ?? []).map((item) => ({
      ...item,
      changeSummary: getBriefItemChangeSummary(item),
      expectedOutcome: getBriefItemExpectedOutcome(item),
      humanStatus: getBriefItemHumanStatus(item.decision_status),
      decisionCopy: getBriefItemDecisionCopy(item),
    }));
    const storedCases = casesByBrief.get(brief.id) ?? [];
    const cases = deriveStoredReviewCases({
      brief,
      items,
      cases: storedCases,
      caseItems: storedCases.flatMap((reviewCase) => caseItemsByCase.get(reviewCase.id) ?? []),
    });
    return {
      ...brief,
      items,
      cases,
      stats: countBriefItems(items),
    };
  });
}

export async function getLatestReviewBrief() {
  const briefs = await listReviewBriefs();
  return briefs.find((brief) => brief.status === "published" || brief.status === "draft") ?? briefs[0] ?? null;
}

export async function getReviewBriefDetail(briefId: string) {
  const supabase = getSupabaseAdmin();
  const { data: briefData, error: briefError } = await supabase
    .from("review_briefs")
    .select("id, run_id, period_type, title, summary, status, coverage_start, coverage_end, item_count, metadata, published_at, completed_at, created_at")
    .eq("id", briefId)
    .maybeSingle();

  if (briefError) throw briefError;

  const brief = (briefData as ReviewBriefRow | null) ?? null;
  if (!brief) return null;

  const { data: itemsData, error: itemsError } = await supabase
    .from("review_brief_items")
    .select("id, brief_id, proposal_id, finding_id, category, title, problem, impact, recommendation, suggested_action_type, suggested_change_summary, expected_outcome, apply_mode, evidence_summary, priority, decision_status, sort_order, metadata, created_at")
    .eq("brief_id", briefId)
    .order("sort_order", { ascending: true });

  if (itemsError) throw itemsError;

  const items = (itemsData ?? []) as ReviewBriefItemRow[];
  const proposalIds = items
    .map((item) => item.proposal_id)
    .filter((proposalId): proposalId is string => Boolean(proposalId));

  let proposalLookup = new Map<string, { id: string; status: string }>();
  if (proposalIds.length > 0) {
    const { data: proposalsData, error: proposalsError } = await supabase
      .from("agent_proposals")
      .select("id, status")
      .in("id", proposalIds);

    if (proposalsError) throw proposalsError;
    proposalLookup = new Map(
      ((proposalsData ?? []) as Array<{ id: string; status: string }>).map((proposal) => [proposal.id, proposal]),
    );
  }

  const { data: storedCasesData, error: storedCasesError } = await supabase
    .from("review_cases")
    .select("id, brief_id, case_key, case_type, category, source_kind, source_ref, action_type, theme_name, subtopic_name, title, summary, problem, impact, change_summary, expected_outcome, evidence_summary, priority, status, decision_status, reviewed_at, reviewer_label, review_notes, item_count, pending_item_count, draft_status, draft_generated_at, draft_package, metadata, created_at")
    .eq("brief_id", briefId)
    .order("created_at", { ascending: true });

  if (storedCasesError) throw storedCasesError;

  const storedCases = (storedCasesData ?? []) as ReviewCaseRow[];
  let storedCaseItems: ReviewCaseItemRow[] = [];
  if (storedCases.length > 0) {
    const { data: storedCaseItemsData, error: storedCaseItemsError } = await supabase
      .from("review_case_items")
      .select("case_id, brief_item_id, sort_order")
      .in("case_id", storedCases.map((reviewCase) => reviewCase.id));

    if (storedCaseItemsError) throw storedCaseItemsError;
    storedCaseItems = (storedCaseItemsData ?? []) as ReviewCaseItemRow[];
  }

  const enrichedItems = items.map((item) => ({
    ...item,
    proposalStatus: item.proposal_id ? proposalLookup.get(item.proposal_id)?.status ?? null : null,
    changeSummary: getBriefItemChangeSummary(item),
    expectedOutcome: getBriefItemExpectedOutcome(item),
    humanStatus: getBriefItemHumanStatus(item.decision_status),
    decisionCopy: getBriefItemDecisionCopy(item),
  }));

  return {
    ...brief,
    items: enrichedItems,
    cases: deriveStoredReviewCases({
      brief,
      items: enrichedItems,
      cases: storedCases,
      caseItems: storedCaseItems,
    }),
    stats: countBriefItems(items),
  };
}
