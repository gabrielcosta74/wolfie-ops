type BatchItem = {
  id: string;
  category: "editorial" | "curricular" | "operational";
  title: string;
  problem: string;
  impact: string;
  priority: "low" | "medium" | "high";
  decision_status: "pending" | "approved" | "deferred" | "ignored" | "executed";
  suggested_action_type: string | null;
  changeSummary?: string;
  expectedOutcome?: string;
  metadata: Record<string, unknown>;
};

export type ReviewBatch = {
  id: string;
  category: BatchItem["category"];
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
};

function readTextValue(metadata: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function getSubtopicLabel(metadata: Record<string, unknown>) {
  return readTextValue(metadata, [
    "subtopic_name",
    "matched_subtopic_name",
    "affected_subtopic_name",
    "affected_subtopic",
    "subtema",
    "subtopic",
  ]);
}

function getActionLabel(actionType: string | null, category: BatchItem["category"]) {
  if (actionType === "improve_distractors") return "Melhorar distratores";
  if (actionType === "improve_explanation") return "Melhorar explicações";
  if (actionType === "rewrite_exercise") return "Rever enunciados";
  if (actionType === "reclassify_difficulty") return "Rever dificuldade";
  if (actionType === "add_variants") return "Criar variantes";
  if (actionType === "update_curricular_alignment") return "Atualizar alinhamento curricular";
  if (actionType === "create_new_content") return "Criar conteúdo novo";
  if (actionType === "observe_only") return "Manter em observação";
  if (category === "curricular") return "Rever alinhamento curricular";
  if (category === "operational") return "Resolver situação operacional";
  return "Rever perguntas do banco";
}

function getDefaultScope(category: BatchItem["category"]) {
  if (category === "curricular") return "em conteúdos curriculares";
  if (category === "operational") return "em itens operacionais";
  return "em perguntas do banco";
}

function buildBatchTitle(items: BatchItem[]) {
  const first = items[0];
  const actionLabel = getActionLabel(first.suggested_action_type, first.category);
  const subtopicLabel = getSubtopicLabel(first.metadata);

  if (subtopicLabel) {
    return `${actionLabel} em ${subtopicLabel}`;
  }

  return `${actionLabel} ${getDefaultScope(first.category)}`;
}

function buildBatchSummary(items: BatchItem[]) {
  const first = items[0];
  const baseSummary = buildBatchChangeSummary(items);

  const suffix =
    items.length === 1
      ? "Inclui 1 pergunta."
      : `Inclui ${items.length} perguntas ou sugestões muito semelhantes.`;

  return `${baseSummary} ${suffix}`;
}

function buildBatchChangeSummary(items: BatchItem[]) {
  const first = items[0];
  if (items.length === 1) {
    return first.changeSummary || "O sistema encontrou uma melhoria editorial concreta para esta pergunta.";
  }

  const count = items.length;
  switch (first.suggested_action_type) {
    case "rewrite_exercise":
      return `Reescrever o enunciado e a explicação em ${count} perguntas semelhantes deste bloco.`;
    case "improve_distractors":
      return `Melhorar os distratores em ${count} perguntas semelhantes deste bloco.`;
    case "improve_explanation":
      return `Reforçar a explicação em ${count} perguntas semelhantes deste bloco.`;
    case "add_tags":
      return `Adicionar tags curriculares a ${count} perguntas semelhantes deste bloco.`;
    case "reclassify_subtopic":
      return `Rever o subtema de ${count} perguntas semelhantes deste bloco.`;
    case "observe_only":
      return `Manter ${count} perguntas semelhantes em observação antes de mexer no conteúdo.`;
    default:
      return `O sistema encontrou um grupo de ${count} itens muito parecidos que merecem a mesma melhoria.`;
  }
}

function buildBatchKey(item: BatchItem) {
  const subtopicLabel = getSubtopicLabel(item.metadata) ?? "sem-subtema";
  const actionType = item.suggested_action_type ?? "generic";
  return `${item.category}:${actionType}:${subtopicLabel}`;
}

export function groupReviewItemsIntoBatches<T extends BatchItem>(items: T[]) {
  const pendingItems = items.filter((item) => item.decision_status === "pending");
  const grouped = new Map<string, T[]>();

  for (const item of pendingItems) {
    const key = buildBatchKey(item);
    const current = grouped.get(key) ?? [];
    current.push(item);
    grouped.set(key, current);
  }

  return [...grouped.entries()]
    .map(([key, batchItems]) => ({
      id: key,
      category: batchItems[0].category,
      actionType: batchItems[0].suggested_action_type,
      title: buildBatchTitle(batchItems),
      summary: buildBatchSummary(batchItems),
      problem: batchItems[0].problem,
      impact: batchItems[0].impact,
      changeSummary: buildBatchChangeSummary(batchItems),
      expectedOutcome:
        batchItems[0].expectedOutcome || "Melhoria consistente deste grupo de perguntas do banco.",
      pendingCount: batchItems.length,
      highPriorityCount: batchItems.filter((item) => item.priority === "high").length,
      itemIds: batchItems.map((item) => item.id),
      examples: batchItems.slice(0, 3).map((item) => item.title),
      nextStepLabel: "Abrir caso",
    }))
    .sort((a, b) => {
      if (b.highPriorityCount !== a.highPriorityCount) {
        return b.highPriorityCount - a.highPriorityCount;
      }

      return b.pendingCount - a.pendingCount;
    });
}
